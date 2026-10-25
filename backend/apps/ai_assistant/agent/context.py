"""
Context & Conversation History Manager with Customer Isolation and PII Masking.
Prepares types.Content payloads for Gemini API while sanitizing sensitive customer data.
Retains active product and variant state across conversational turns.
"""

import re
from typing import List, Tuple, Dict, Any, Optional
from google.genai import types
from apps.ai_assistant.services import (
    extract_previously_shown_product_ids,
    normalize_bengali_digits,
    format_product_card,
)

# Defense-in-depth regexes for conversational text masking
# Note: Regex-based masking does not guarantee 100% complete removal of all sensitive
# information, but provides an essential layer of privacy preservation before cloud transmission.
PHONE_REGEX = re.compile(
    r'(?:\+?(?:880|৮৮০)|0|০)[1১][3-9৩-৯](?:[\s\-\.]*[\d০-৯]){8}',
    re.UNICODE
)
EMAIL_REGEX = re.compile(
    r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
)
SECRET_REGEX = re.compile(
    r'(?:Bearer\s+[a-zA-Z0-9_\-\.]+)|(?:AIza[0-9A-Za-z\-_]{16,40})|(?:guest_cart:[a-zA-Z0-9_\-\:]+)'
)
COMMON_ADDRESS_REGEX = re.compile(
    r'(?:House|Road|Flat|Sector|Block|Holding|Village|বাসা|রোড|সেক্টর|ব্লক)[\s\w\-\,\.\#\u0980-\u09FF]{3,35}',
    re.IGNORECASE | re.UNICODE
)


def mask_sensitive_pii(text: Optional[str]) -> str:
    """
    Masks recognized phone numbers, emails, addresses, and bearer secrets from text.
    Returns sanitized string. Safely handles None and non-string inputs.
    """
    if not text or not isinstance(text, str):
        return ""

    sanitized = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
    sanitized = EMAIL_REGEX.sub("[REDACTED_EMAIL]", sanitized)
    sanitized = SECRET_REGEX.sub("[REDACTED_SECRET]", sanitized)
    sanitized = COMMON_ADDRESS_REGEX.sub("[REDACTED_ADDRESS]", sanitized)
    return sanitized


class ContextManager:
    """
    Manages session isolation, history sanitization, and Gemini payload construction.
    Retains active product context across consecutive conversation turns.
    """

    MAX_HISTORY_TURNS = 8

    @classmethod
    def sanitize_history_turn(cls, turn: Any) -> Optional[Dict[str, str]]:
        """
        Validates and sanitizes an individual conversation history entry.
        Filters out malformed entries, masks sensitive customer PII,
        and injects trusted product/variant card context for model turns.
        """
        if not isinstance(turn, dict):
            return None

        role = turn.get("role")
        raw_text = turn.get("text") or turn.get("content") or ""
        if not isinstance(raw_text, str) or not raw_text.strip():
            return None

        # Standardize roles
        gemini_role = "user" if role in ["user", "human", "customer"] else "model"

        # Mask PII in historical turns
        masked_text = mask_sensitive_pii(raw_text.strip())

        # If this is a model turn that recommended products, include trusted product summary
        if gemini_role == "model" and isinstance(turn.get("products"), list):
            p_notes = []
            for p in turn["products"]:
                if isinstance(p, dict) and "name" in p:
                    p_id = p.get("id")
                    p_name = p.get("name")
                    p_price = p.get("starting_price", 0)
                    c_list = ", ".join(p.get("available_colors", []))
                    s_list = ", ".join(p.get("available_sizes", []))
                    p_notes.append(
                        f"[Product Context: ID={p_id}, Name='{p_name}', Price=৳{p_price:.0f}, Colors={c_list}, Sizes={s_list}]"
                    )
            if p_notes:
                masked_text = f"{masked_text}\n" + "\n".join(p_notes)

        return {"role": gemini_role, "text": masked_text}

    @classmethod
    def extract_active_product_context(
        cls,
        history: Optional[List[Any]] = None,
        request: Optional[Any] = None,
        session_key: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Extracts verified active product metadata from conversation history or session.
        Grounds product and variant attributes in real database state.
        """
        from apps.products.models import Product

        cand_id = None

        # 1. Check history in reverse order
        if history and isinstance(history, list):
            for turn in reversed(history):
                if not isinstance(turn, dict):
                    continue

                # A. Products list
                prods = turn.get("products")
                if isinstance(prods, list) and prods:
                    for p in prods:
                        if isinstance(p, dict) and "id" in p:
                            try:
                                cand_id = int(p["id"])
                                break
                            except (ValueError, TypeError):
                                pass
                if cand_id:
                    break

                # B. product_ids list
                p_ids = turn.get("product_ids")
                if isinstance(p_ids, (list, tuple)) and p_ids:
                    for pid in p_ids:
                        try:
                            cand_id = int(pid)
                            break
                        except (ValueError, TypeError):
                            pass
                if cand_id:
                    break

                # C. Product URL regex: /products/(\d+)
                t_text = turn.get("text") or ""
                m = re.search(r"/products/(\d+)", t_text)
                if m:
                    try:
                        cand_id = int(m.group(1))
                        break
                    except (ValueError, TypeError):
                        pass

        # 2. Check session fallback
        if not cand_id and request and hasattr(request, "session"):
            cand_id = request.session.get("active_product_id")

        if not cand_id:
            return None

        # 3. Ground against real database product
        try:
            product = (
                Product.objects.filter(id=cand_id, is_active=True)
                .prefetch_related("variants__attributes__attribute_type")
                .first()
            )
        except Exception:
            product = None

        if not product:
            return None

        # Extract verified variants, colors, and sizes
        colors = set()
        sizes = set()
        confirmed_combinations = {}
        variants_summary = []

        for v in product.variants.all():
            v_color = None
            v_size = None
            for a in v.attributes.all():
                at = a.attribute_type.name.lower()
                if "color" in at or "রং" in at:
                    v_color = a.value
                elif "size" in at:
                    v_size = a.value

            if v_color:
                colors.add(v_color)
                if v_size:
                    sizes.add(v_size)
                    confirmed_combinations.setdefault(v_color, []).append(v_size)
                else:
                    confirmed_combinations.setdefault(v_color, [])
            elif v_size:
                sizes.add(v_size)

            variants_summary.append({
                "variant_id": v.id,
                "sku": v.sku,
                "color": v_color,
                "size": v_size,
                "price": float(v.price),
                "stock": v.stock,
                "in_stock": v.stock > 0,
            })

        prices = [v["price"] for v in variants_summary if v["price"] is not None]
        starting_price = min(prices) if prices else float(product.base_price)

        return {
            "id": product.id,
            "product_id": product.id,
            "name": product.name,
            "base_price": float(product.base_price),
            "starting_price": starting_price,
            "available_colors": list(colors),
            "available_sizes": list(sizes),
            "confirmed_combinations": confirmed_combinations,
            "variants": variants_summary,
            "card": format_product_card(product),
        }

    @classmethod
    def build_gemini_contents(
        cls,
        message: Optional[str],
        history: Optional[List[Any]] = None,
        session_key: Optional[str] = None,
        user: Optional[Any] = None,
    ) -> Tuple[List[types.Content], List[int]]:
        """
        Constructs sanitized types.Content payloads for Gemini model calls.

        Guarantees:
        - Customer context is isolated to the current conversation turn/history.
        - History is capped to the last MAX_HISTORY_TURNS to prevent context pollution.
        - Malformed or empty history turns are safely rejected without crashing.
        - User input is normalized for Bengali digits and masked before transmission.
        - Extracts previously displayed product IDs for search deduplication.
        """
        contents: List[types.Content] = []
        shown_ids: List[int] = []

        # 1. Safely extract shown product IDs if history is iterable
        if history and isinstance(history, list):
            try:
                shown_ids = extract_previously_shown_product_ids(history)
            except Exception:
                shown_ids = []

            # 2. Process and sanitize history turns
            valid_turns = []
            for item in history:
                sanitized_turn = cls.sanitize_history_turn(item)
                if sanitized_turn:
                    valid_turns.append(sanitized_turn)

            # Cap history window
            recent_turns = valid_turns[-cls.MAX_HISTORY_TURNS:]
            for turn in recent_turns:
                contents.append(
                    types.Content(
                        role=turn["role"],
                        parts=[types.Part.from_text(text=turn["text"])],
                    )
                )

        # 3. Clean and process current user message
        raw_msg = (message or "").strip()
        if raw_msg:
            # Canonicalize Bengali digits
            clean_msg = normalize_bengali_digits(raw_msg)
            # Mask PII in current user message
            masked_msg = mask_sensitive_pii(clean_msg)
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=masked_msg)],
                )
            )
        else:
            # Fallback for empty message turns
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text="হ্যালো")],
                )
            )

        return contents, shown_ids
