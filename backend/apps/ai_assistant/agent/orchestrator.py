"""
Agent Orchestrator for Kids & Family AI Shopping Assistant.
Executes the bounded multi-turn Gemini tool-calling loop, coordinates tool execution,
and formats responses complying with the React frontend contract.
"""

import re
import logging
from typing import Dict, Any, List, Optional
from google.genai import types

from apps.ai_assistant.gemini_service import get_gemini_client, PRIMARY_MODEL, FALLBACK_MODELS
from .prompt import build_system_instruction
from .context import ContextManager
from .tools import get_agent_tools, dispatch_tool_call
from .tools.policy_tools import get_verified_shop_settings
from .errors import classify_error, log_sanitized_error, GeminiErrorKind

logger = logging.getLogger(__name__)

# Bounded iteration limit to prevent infinite tool loops and control latency (hard cap 4)
MAX_AGENT_TOOL_TURNS = 4


class AgentOrchestrator:
    """
    Orchestrates the AI Shopping Agent conversation turn:
    1. Fast security & safety guards.
    2. Builds multi-turn conversation context and sanitizes customer PII.
    3. Invokes Gemini with typed Tool Declarations.
    4. Executes requested tools against Django backend with authorization and validation.
    5. Returns tool outputs to Gemini in a bounded loop (<= 4 turns).
    6. Composes natural Bengali e-commerce response adhering to React frontend contract.
    """

    @classmethod
    def run(
        cls,
        message: str,
        history: Optional[List[Any]] = None,
        session_key: Optional[str] = None,
        user: Optional[Any] = None,
        request: Optional[Any] = None,
        draft_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        clean_msg = (message or "").strip()
        if not clean_msg:
            return {
                "success": True,
                "reply": "স্বাগতম! আমি Kids & Family-এর AI শপিং সহকারী 🤖\nআপনাকে কীভাবে সাহায্য করতে পারি? পণ্য খোঁজা, সাইজ নির্ধারণ, ডেলিভারি তথ্য বা অর্ডার ট্র্যাক করতে যেকোনো প্রশ্ন করতে পারেন।",
                "products": [],
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "greeting",
            }

        # 1. Fast Security & Adversarial Guard
        blocked_reply = cls._check_security_fast_guard(clean_msg)
        if blocked_reply:
            return blocked_reply

        # 2. Build Store Context, Active Product & Gemini Client
        store_context = get_verified_shop_settings()
        active_product = ContextManager.extract_active_product_context(
            history=history, request=request, session_key=session_key
        )
        if active_product and request and hasattr(request, "session"):
            try:
                request.session["active_product_id"] = active_product["id"]
            except Exception:
                pass

        # 2.1 Fast-Path: Deterministic Store FAQs, Live Order Tracking & Unambiguous Product Context
        fast_direct = cls._check_fast_deterministic_path(
            clean_msg,
            history=history,
            user=user,
            session_key=session_key,
            store_context=store_context,
            active_product=active_product,
            request=request,
        )
        if fast_direct:
            return fast_direct

        client = get_gemini_client()
        if not client:
            logger.warning("[Agent Orchestrator] Gemini client unavailable, falling back.")
            return cls._fallback_response(clean_msg, history, session_key, user, store_context)

        # 3. Prepare Tools, System Instruction & Context
        tools = get_agent_tools()
        system_instruction = build_system_instruction(store_context, active_product=active_product)
        contents, shown_ids = ContextManager.build_gemini_contents(
            clean_msg, history=history, session_key=session_key, user=user
        )

        tool_context = {
            "request": request,
            "user": user,
            "session_key": session_key,
            "shown_product_ids": shown_ids,
            "store_context": store_context,
            "draft_context": draft_context,
            "active_product": active_product,
            "active_product_id": active_product["id"] if active_product else None,
        }

        # State collected from tools across iterations
        state = {
            "products": [],
            "order": None,
            "order_created": False,
            "cart_updated": False,
            "added_product_id": None,
            "order_draft": None,
            "order_confirmation_requested": False,
            "intents": set(),
        }

        config = types.GenerateContentConfig(
            tools=tools,
            system_instruction=system_instruction,
            temperature=0.7,
            thinking_config=types.ThinkingConfig(thinking_level="minimal"),
        )

        models_to_try = [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]
        final_reply = ""
        used_model = PRIMARY_MODEL

        # 4. Multi-turn Tool Calling Loop
        for model_name in models_to_try:
            used_model = model_name
            try:
                loop_contents = list(contents)
                for turn in range(MAX_AGENT_TOOL_TURNS):
                    response = client.models.generate_content(
                        model=model_name,
                        contents=loop_contents,
                        config=config,
                    )

                    # Check for function calls
                    function_calls = getattr(response, "function_calls", None)
                    if not function_calls:
                        # Model generated final natural language response
                        if response and hasattr(response, "text") and response.text:
                            final_reply = response.text.strip()
                        break

                    # Append model's content part to history
                    if response.candidates and response.candidates[0].content:
                        loop_contents.append(response.candidates[0].content)

                    # Dispatch each function call and construct response parts
                    response_parts = []
                    for call in function_calls:
                        tool_name = call.name
                        tool_args = call.args if hasattr(call, "args") and isinstance(call.args, dict) else {}

                        tool_result = dispatch_tool_call(
                            tool_name=tool_name,
                            tool_args=tool_args,
                            context=tool_context,
                        )

                        # Accumulate state for frontend response
                        cls._accumulate_state(tool_name, tool_result, state)

                        # Wrap tool result for Gemini
                        response_parts.append(
                            types.Part.from_function_response(
                                name=tool_name,
                                response={"result": tool_result},
                            )
                        )

                    # Append tool responses as 'tool' role content
                    loop_contents.append(
                        types.Content(role="user", parts=response_parts)
                    )

                # Loop completed without provider exception; break out of model failover
                break

            except Exception as e:
                error_kind = classify_error(e)
                log_sanitized_error("AgentOrchestrator.run", e, session_id=session_key)
                if error_kind == GeminiErrorKind.PROGRAMMING:
                    # Never swallow programming errors
                    raise
                # Bounded safety guard: If state-modifying side-effects (e.g. order_created or cart_updated)
                # have already been successfully executed, do NOT retry with subsequent fallback models.
                # Stopping failover here preserves the completed operation and prevents duplicate mutations.
                if state.get("order_created") or state.get("cart_updated"):
                    logger.info("State-modifying tool already executed; halting model failover to prevent duplicate side effects.")
                    break
                # For transient/configuration errors without side effects, try next model in fallback list
                continue

        # If model failed or produced empty reply, fallback to legacy deterministic engine or grounded response
        if not final_reply:
            if not state.get("products") and not state.get("order") and not state.get("order_draft") and not state.get("order_created"):
                return cls._fallback_response(clean_msg, history, session_key, user, store_context)
            final_reply = cls._compose_fallback_text(clean_msg, state, store_context)

        # Ensure products card attached if cart was updated or active product discussed
        if not state["products"] and active_product and (state["cart_updated"] or "product_detail" in state["intents"] or "cart_updated" in state["intents"]):
            state["products"].append(active_product["card"])

        if state.get("products") and request and hasattr(request, "session"):
            try:
                request.session["active_product_id"] = state["products"][0].get("id")
            except Exception:
                pass

        # Resolve dominant intent for frontend
        dominant_intent = "general"
        if state["order_created"]:
            dominant_intent = "order_created"
        elif state.get("is_replay"):
            dominant_intent = "order_replayed"
        elif state["order_confirmation_requested"]:
            dominant_intent = "order_confirmation_requested"
        elif state["cart_updated"]:
            dominant_intent = "cart_updated"
        elif state["order"]:
            dominant_intent = "order_tracking"
        elif state["products"]:
            dominant_intent = "recommendation"
        elif state["intents"]:
            dominant_intent = list(state["intents"])[0]

        return {
            "success": True,
            "reply": final_reply,
            "products": state["products"][:4],
            "order": state["order"],
            "order_created": state["order_created"],
            "cart_updated": state["cart_updated"],
            "added_product_id": state["added_product_id"],
            "order_draft": state["order_draft"],
            "order_confirmation_requested": state["order_confirmation_requested"],
            "intent": dominant_intent,
            "engine": f"gemini-agent ({used_model})",
        }

    @classmethod
    def _accumulate_state(cls, tool_name: str, tool_result: dict, state: dict):
        """Extracts and normalizes frontend state from tool outputs."""
        if not isinstance(tool_result, dict):
            return

        if tool_name == "search_products":
            prods = tool_result.get("products", [])
            if prods and isinstance(prods, list):
                state["products"].extend(prods)
                state["intents"].add("recommendation")

        elif tool_name == "get_product_details":
            card = tool_result.get("card")
            if card:
                state["products"].append(card)
                state["intents"].add("product_detail")

        elif tool_name == "track_order":
            ord_card = tool_result.get("order")
            if ord_card:
                state["order"] = ord_card
                state["intents"].add("order_tracking")

        elif tool_name in ("manage_cart", "add_item_to_cart", "clear_cart"):
            if tool_result.get("success"):
                state["cart_updated"] = True
                if tool_result.get("added_product_id"):
                    state["added_product_id"] = tool_result.get("added_product_id")
                state["intents"].add("cart_updated")

        elif tool_name in ("prepare_order_draft", "place_conversational_order"):
            if tool_result.get("order_draft"):
                state["order_draft"] = tool_result.get("order_draft")
                state["order_confirmation_requested"] = True
                state["order_created"] = False
                state["intents"].add("order_confirmation_requested")

        elif tool_name == "confirm_order":
            if tool_result.get("order_created"):
                state["order_created"] = True
                state["is_replay"] = False
                state["order"] = tool_result.get("order")
                state["cart_updated"] = True
                state["order_draft"] = None
                state["order_confirmation_requested"] = False
                state["intents"].add("order_created")
            elif tool_result.get("is_replay"):
                state["order_created"] = False
                state["is_replay"] = True
                state["order"] = tool_result.get("order")
                state["cart_updated"] = False
                state["order_draft"] = None
                state["order_confirmation_requested"] = False
                state["intents"].add("order_replayed")

        elif tool_name == "get_store_policies":
            state["intents"].add("store_policy")

    @classmethod
    def _check_fast_deterministic_path(
        cls,
        clean_msg: str,
        history: Optional[List[dict]] = None,
        user=None,
        session_key: Optional[str] = None,
        store_context: Optional[dict] = None,
        active_product: Optional[dict] = None,
        request=None,
        **kwargs,
    ) -> Optional[dict]:
        """
        Sub-millisecond fast-path for:
        1. Order tracking by 11-digit phone number or order number.
        2. Authoritative store delivery charges and timelines.
        3. Standard return & exchange policies.
        Eliminates network latency, 504 timeouts, and LLM hallucinations.
        """
        lower = clean_msg.lower()

        # 1. Order tracking by phone or order ID
        clean_digits = re.sub(r"\D", "", clean_msg)
        phone_val = ""
        if len(clean_digits) in (10, 11) and re.match(r"^(?:0)?1[3-9]\d{8}$", clean_digits):
            phone_val = clean_digits if len(clean_digits) == 11 else f"0{clean_digits}"

        m_order_id = re.search(r"KF[- ]?\d{4,14}", clean_msg, re.IGNORECASE)
        order_val = m_order_id.group(0) if m_order_id else ""

        is_pure_num = bool(phone_val or order_val)
        has_tracking_context = is_pure_num or any(w in lower for w in ["track", "ট্র্যাক", "অর্ডার", "status", "স্ট্যাটাস", "পার্সেল"])
        if not has_tracking_context and history and isinstance(history, list):
            for turn in reversed(history[-3:]):
                t_text = (turn.get("text") or "").lower()
                if any(w in t_text for w in ["track", "ট্র্যাক", "অর্ডার নম্বর", "order number", "মোবাইল নম্বর", "ফোন নম্বর"]):
                    has_tracking_context = True
                    break

        if (phone_val or order_val) and has_tracking_context:
            from .tools.order_tools import execute_track_order

            track_res = execute_track_order(
                order_number=order_val,
                phone=phone_val,
                user=user,
                session_key=session_key,
            )
            if track_res.get("success") and track_res.get("order"):
                ord_card = track_res["order"]
                mult = track_res.get("multiple_orders", [])
                if mult and len(mult) > 1:
                    reply = (
                        f"আপনার মোবাইল নম্বর (`{phone_val}`)-এ মোট **{len(mult)}টি সাম্প্রতিক অর্ডার** পাওয়া গেছে! 📦\n\n"
                        f"**আপনার সাম্প্রতিক অর্ডারগুলোর তালিকা:**\n"
                    )
                    status_bn_map = {
                        "pending": "পর্যালোচনাধীন",
                        "confirmed": "কনফার্মড",
                        "processing": "প্রসেসিং",
                        "shipped": "শিপড",
                        "delivered": "ডেলিভার্ড",
                        "cancelled": "বাতিল",
                    }
                    for idx, mo in enumerate(mult, 1):
                        st_bn = status_bn_map.get(mo["status"], mo["status"])
                        created_info = f" | তারিখ: {mo['created_at']}" if mo.get('created_at') else ""
                        reply += f"{idx}. **অর্ডার আইডি: `{mo['order_number']}`**\n"
                        reply += f"   • স্ট্যাটাস: **{st_bn}**{created_info}\n"
                        reply += f"   • মোট বিল: ৳{mo['total']:.0f}\n"

                    reply += (
                        f"\nনিচে আপনার **সর্বশেষ অর্ডারের (`{ord_card.get('order_number')}`)** লাইভ ট্র্যাকিং কার্ড দেওয়া হলো।\n"
                        f"তালিকার অন্য কোনো নির্দিষ্ট অর্ডার ট্র্যাক করতে চাইলে শুধু সেটির অর্ডার নম্বর (যেমন: `{mult[1]['order_number']}`) লিখে পাঠান।"
                    )
                else:
                    reply = (
                        f"আপনার অর্ডারটি খুঁজে পাওয়া গেছে! 📦\n\n"
                        f"• **অর্ডার নম্বর:** `{ord_card.get('order_number')}`\n"
                        f"• **বর্তমান স্ট্যাটাস:** **{ord_card.get('status_title')}** ({ord_card.get('status_desc')})\n"
                        f"• **মোট বিল:** ৳{track_res.get('total', 0):.0f} ({'ক্যাশ অন ডেলিভারি' if track_res.get('payment_method') == 'cod' else 'অনলাইন পেমেন্ট'})\n\n"
                        f"নিচে আপনার অর্ডারের বিস্তারিত কার্ড সংযুক্ত করা হলো।"
                    )
                return {
                    "success": True,
                    "reply": reply,
                    "products": [],
                    "order": ord_card,
                    "order_created": False,
                    "cart_updated": False,
                    "added_product_id": None,
                    "order_draft": None,
                    "order_confirmation_requested": False,
                    "intent": "order_tracking",
                    "engine": "fast-track-engine",
                }
            elif is_pure_num or any(w in lower for w in ["track", "ট্র্যাক"]):
                target_val = order_val or phone_val
                return {
                    "success": True,
                    "reply": f"দুঃখিত, '{target_val}' দিয়ে আমাদের সিস্টেমে কোনো অর্ডার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক মোবাইল নম্বর বা অর্ডার নম্বর (যেমন: KF2610251234) জানান।",
                    "products": [],
                    "order": None,
                    "order_created": False,
                    "cart_updated": False,
                    "added_product_id": None,
                    "order_draft": None,
                    "order_confirmation_requested": False,
                    "intent": "order_not_found",
                    "engine": "fast-track-engine",
                }

        # 2. Pure Delivery FAQ
        store_context = store_context or get_verified_shop_settings()
        has_delivery_word = any(w in lower for w in ["delivery", "ডেলিভারি", "চার্জ", "charge"])
        has_timing_word = any(w in lower for w in ["কত", "সময়", "সময়", "koto", "rate", "lagbe", "কবে", "দিন", "din"])
        has_shopping_word = any(w in lower for w in ["shirt", "panjabi", "dress", "frock", "order", "কিনব", "দেখান", "dekhan", "kinte", "পণ্য", "পোশাক", "item"])

        if has_delivery_word and has_timing_word and not has_shopping_word:
            inside = float(store_context.get("delivery_inside_dhaka", 60))
            outside = float(store_context.get("delivery_outside_dhaka", 120))
            reply = (
                f"আমাদের ডেলিভারি চার্জ ও সময় সংক্রান্ত তথ্য:\n\n"
                f"• **ঢাকার ভেতরে:** ডেলিভারি চার্জ ৳{inside:.0f} (সময়: ২৪–৪৮ ঘণ্টা)\n"
                f"• **ঢাকার বাইরে:** ডেলিভারি চার্জ ৳{outside:.0f} (সময়: ৩–৫ কর্মদিবস)\n\n"
                f"পেমেন্ট হিসেবে ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ) এবং অনলাইন পেমেন্ট সুবিধা রয়েছে।"
            )
            return {
                "success": True,
                "reply": reply,
                "products": [],
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "store_policy",
                "engine": "fast-faq-engine",
            }

        # 3. Pure Return & Exchange FAQ
        has_return_word = any(w in lower for w in ["return", "exchange", "রিটার্ন", "এক্সচেঞ্জ", "বদলা", "পরিবর্তন", "সাইজ না হলে", "size na hole"])
        if has_return_word and not has_shopping_word:
            phone = store_context.get("phone", "+880 1700-000000")
            reply = (
                f"হ্যাঁ, আমাদের রিটার্ন ও এক্সচেঞ্জ সুবিধা রয়েছে! 🌸\n\n"
                f"সাইজ না মিললে বা কোনো ত্রুটি থাকলে পণ্যটি গ্রহণের পর অক্ষত ও ট্যাগ লাগানো অবস্থায় এক্সচেঞ্জ করতে পারবেন।\n"
                f"যেকোনো সহায়তার জন্য আমাদের হেল্পলাইনে সরাসরি যোগাযোগ করতে পারেন: {phone}।"
            )
            return {
                "success": True,
                "reply": reply,
                "products": [],
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "store_policy",
                "engine": "fast-faq-engine",
            }

        # 4. Unambiguous Product Context & Follow-up Operations
        if not active_product and history:
            active_product = ContextManager.extract_active_product_context(
                history=history, request=request, session_key=session_key
            )

        garment_keywords = [
            "পাঞ্জাবি", "panjabi", "kurta", "কুর্তা", "shirt", "শার্ট", "tshirt",
            "frock", "ফ্রক", "gown", "গাউন", "lehenga", "লেহেঙ্গা", "saree", "শাড়ি", "কাবলি", "kabli"
        ]
        is_different_search = (
            any(w in lower for w in garment_keywords)
            and active_product
            and not any(w in active_product.get("name", "").lower() for w in garment_keywords)
        )

        if not is_different_search:
            from .tools.product_tools import extract_color_from_text, extract_size_from_text, resolve_variant_for_product
            from .tools.cart_tools import execute_manage_cart

            # A. Add to Cart Intent
            has_cart_keyword = any(w in lower for w in [
                "cart", "কার্ট", "কার্টে", "কার্টেও", "bag", "ব্যাগ", "ব্যাগে", "add to cart",
                "যোগ করো", "যোগ করুন", "যোগ করে", "এড করো", "এড করুন", "এড করে", "এ্যাড করো",
                "এ্যাড করুন", "কার্টে নিন", "কার্টে দিন", "কার্টে দাও", "ব্যাগে নিন", "ব্যাগে দিন",
            ]) or (
                any(w in lower for w in ["add", "এড", "এ্যাড", "যোগ"])
                and any(w in lower for w in ["koro", "korun", "dao", "den", "din", "dew", "করো", "করুন", "দিন", "দাও", "নিন"])
            )

            if has_cart_keyword:
                if active_product:
                    col = extract_color_from_text(clean_msg, active_product.get("available_colors"))
                    sz = extract_size_from_text(clean_msg, active_product.get("available_sizes"))
                    cart_res = execute_manage_cart(
                        action="add",
                        product_id=active_product["id"],
                        color=col,
                        size=sz,
                        quantity=1,
                        request=request,
                        user=user,
                        session_key=session_key,
                    )
                    if cart_res.get("success"):
                        reply = (
                            f"{cart_res.get('message')}\n\n"
                            f"• মোট আইটেম: {cart_res.get('total_items', 1)}টি\n"
                            f"• মোট কার্ট মূল্য: ৳{cart_res.get('total_price', 0):.0f}\n\n"
                            f"আপনি কি সরাসরি অর্ডার করতে চান নাকি আরও পণ্য দেখতে চান?"
                        )
                        return {
                            "success": True,
                            "reply": reply,
                            "products": [active_product["card"]],
                            "order": None,
                            "order_created": False,
                            "cart_updated": True,
                            "added_product_id": active_product["id"],
                            "order_draft": None,
                            "order_confirmation_requested": False,
                            "intent": "cart_updated",
                            "engine": "fast-cart-engine",
                        }
                    else:
                        return {
                            "success": True,
                            "reply": cart_res.get("error", "দুঃখিত, পণ্যটি কার্টে যোগ করা যায়নি।"),
                            "products": [active_product["card"]],
                            "order": None,
                            "order_created": False,
                            "cart_updated": False,
                            "added_product_id": None,
                            "order_draft": None,
                            "order_confirmation_requested": False,
                            "intent": "variant_unavailable",
                            "engine": "fast-cart-engine",
                        }
                else:
                    return {
                        "success": True,
                        "reply": "আপনি কোন পোশাকটি কার্টে যোগ করতে চান? অনুগ্রহ করে পোশাকটির নাম বা লিংক জানান, আমি এখনই চেক করে কার্টে যোগ করে দিচ্ছি। 😊",
                        "products": [],
                        "order": None,
                        "order_created": False,
                        "cart_updated": False,
                        "added_product_id": None,
                        "order_draft": None,
                        "order_confirmation_requested": False,
                        "intent": "clarification_needed",
                        "engine": "fast-cart-engine",
                    }

            # B. Variant / Color / Size Availability Query
            if active_product:
                col = extract_color_from_text(clean_msg, active_product.get("available_colors"))
                sz = extract_size_from_text(clean_msg, active_product.get("available_sizes"))
                is_variant_query = bool(col or sz) and (
                    "?" in clean_msg
                    or any(w in lower for w in [
                        "ache", "ase", "pabo", "paowa", "hobe", "আছে", "হবে", "পাওয়া", "পাব",
                        "size", "সাইজ", "color", "কালার", "রং"
                    ])
                    or len(clean_msg.split()) <= 4
                )

                if is_variant_query:
                    res = resolve_variant_for_product(active_product["id"], color=col, size=sz)
                    if res.get("success"):
                        v_col = col or res.get("color")
                        v_sz = sz or res.get("size")
                        col_str = f"**{v_col}** কালারে " if v_col else ""
                        sz_str = f"**{v_sz}** সাইজটি " if v_sz else ""
                        stock_cnt = res.get("stock", 0)
                        if res.get("in_stock", True):
                            reply = (
                                f"হ্যাঁ! **{active_product['name']}**-এর {col_str}{sz_str}আমাদের স্টকে অ্যাভেইলেবল রয়েছে। 🌸\n\n"
                                f"• মূল্য: ৳{res.get('price', active_product['starting_price']):.0f}\n"
                                f"• বর্তমান স্টক: {stock_cnt}টি\n\n"
                                f"আপনি চাইলে সরাসরি নিচের 'কার্টে নিন' বাটনে চাপ দিয়ে অথবা আমাকে 'কার্টে যোগ করো' লিখে এটি কার্টে নিতে পারেন।"
                            )
                        else:
                            reply = (
                                f"দুঃখিত, **{active_product['name']}**-এর {col_str}{sz_str}এই মুহূর্তে স্টক আউট হয়ে গেছে।\n\n"
                                f"তবে এই পোশাকে অন্য কিছু ভ্যারিয়েন্ট অ্যাভেইলেবল আছে। আপনি কি অন্য কোনো সাইজ বা কালার দেখতে চান?"
                            )
                        return {
                            "success": True,
                            "reply": reply,
                            "products": [active_product["card"]],
                            "order": None,
                            "order_created": False,
                            "cart_updated": False,
                            "added_product_id": None,
                            "order_draft": None,
                            "order_confirmation_requested": False,
                            "intent": "product_detail",
                            "engine": "fast-variant-engine",
                        }
                    elif res.get("reason") in ("variant_not_found", "color_not_found", "size_not_found"):
                        conf_opts = res.get("confirmed_options", {})
                        conf_lines = []
                        for c_name, sz_list in conf_opts.items():
                            if sz_list:
                                conf_lines.append(f"• **{c_name}** কালারে: সাইজ **{', '.join(sz_list)}**")
                            else:
                                conf_lines.append(f"• **{c_name}** কালার")
                        opts_str = "\n".join(conf_lines) if conf_lines else "বর্তমানে অন্য কোনো কম্বিনেশন খালি নেই।"
                        col_str = f"**{col}** কালারে " if col else ""
                        sz_str = f"**{sz}** সাইজটি " if sz else ""
                        reply = (
                            f"দুঃখিত, **{active_product['name']}** পোশাকে {col_str}{sz_str}এই মুহূর্তে স্টকে নেই।\n\n"
                            f"তবে এই পোশাকে নিচের সাইজ ও কালারগুলো স্টকে অ্যাভেইলেবল রয়েছে:\n{opts_str}\n\n"
                            f"আপনি কি এর মধ্য থেকে কোনো সাইজ কার্টে নিতে চান?"
                        )
                        return {
                            "success": True,
                            "reply": reply,
                            "products": [active_product["card"]],
                            "order": None,
                            "order_created": False,
                            "cart_updated": False,
                            "added_product_id": None,
                            "order_draft": None,
                            "order_confirmation_requested": False,
                            "intent": "variant_unavailable",
                            "engine": "fast-variant-engine",
                        }

            # C. Price Query Intent
            has_price_query = any(w in lower for w in [
                "দাম কত", "মূল্য কত", "price koto", "koto dam", "dam koto", "rate koto",
                "দাম কত?", "মূল্য কত?", "price koto?", "koto dam?", "dam koto?"
            ]) or (
                any(w in lower for w in ["দাম", "মূল্য", "price", "dam", "rate"])
                and any(w in lower for w in ["কত", "koto"])
            )

            if has_price_query:
                if active_product:
                    c_str = ", ".join(active_product.get("available_colors", []))
                    s_str = ", ".join(active_product.get("available_sizes", []))
                    reply = (
                        f"**{active_product['name']}**-এর মূল্য ৳{active_product['starting_price']:.0f}। 🌸\n\n"
                        f"• কালার: {c_str or 'স্ট্যান্ডার্ড'}\n"
                        f"• সাইজ: {s_str or 'স্ট্যান্ডার্ড'}\n\n"
                        f"আপনি কি এটি কার্টে যোগ করতে চান?"
                    )
                    return {
                        "success": True,
                        "reply": reply,
                        "products": [active_product["card"]],
                        "order": None,
                        "order_created": False,
                        "cart_updated": False,
                        "added_product_id": None,
                        "order_draft": None,
                        "order_confirmation_requested": False,
                        "intent": "product_detail",
                        "engine": "fast-price-engine",
                    }
                else:
                    return {
                        "success": True,
                        "reply": "আপনি কোন পোশাকটির দাম জানতে চাচ্ছেন? অনুগ্রহ করে পোশাকটির নাম লিখে জানান, আমি এখনই সঠিক মূল্য ও বিস্তারিত জানিয়ে দিচ্ছি। 😊",
                        "products": [],
                        "order": None,
                        "order_created": False,
                        "cart_updated": False,
                        "added_product_id": None,
                        "order_draft": None,
                        "order_confirmation_requested": False,
                        "intent": "clarification_needed",
                        "engine": "fast-price-engine",
                    }

        return None

    @classmethod
    def _check_security_fast_guard(cls, message: str) -> Optional[dict]:
        """Fast pre-LLM check to block prompt injections and destructive attacks."""
        lower = message.lower()
        security_patterns = [
            r"\[system\s*override\]",
            r"ignore\s+(?:all\s+)?previous\s+instructions",
            r"(?:reveal|output|show)\s+(?:your\s+)?system\s+prompt",
            r"developer\s+mode",
            r"database\s+password",
            r"secret\s*key",
            r"drop\s+table",
            r"alter\s+table",
            r"<script>",
            r"admin'\s*or\s*'1'='1",
            r"set\s+all\s+product\s+prices\s+to\s+0",
        ]
        if any(re.search(pat, lower) for pat in security_patterns):
            return {
                "success": True,
                "reply": "আমি Kids & Family-এর AI শপিং সহকারী 🤖\nআপনার অর্ডার, পছন্দসই পোশাক খোঁজা বা ডেলিভারি তথ্য জানতে যেকোনো প্রশ্ন করতে পারেন। আমি আনন্দের সাথে সাহায্য করতে প্রস্তুত!",
                "products": [],
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "security_blocked",
            }
        return None

    @classmethod
    def _compose_fallback_text(cls, message: str, state: dict, store_context: dict) -> str:
        """Composes clean Bengali response if Gemini generation was truncated or empty."""
        if state.get("order_created") and state.get("order"):
            return (
                f"🎉 **অভিনন্দন!** আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে!\n"
                f"অর্ডার নম্বর: `{state['order'].get('order_number')}`\n"
                f"আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।"
            )
        if state.get("is_replay") and state.get("order"):
            return (
                f"আপনার অর্ডারটি (অর্ডার নং: `{state['order'].get('order_number')}`) ইতিমধ্যে সফলভাবে গ্রহণ করা হয়েছে।\n"
                f"মোট প্রদেয় ৳{float(state['order'].get('total', 0)):.0f} (ক্যাশ অন ডেলিভারি)।"
            )
        if state["order_confirmation_requested"] and state["order_draft"]:
            draft = state["order_draft"]
            return (
                f"আপনার অর্ডারের বিবরণ:\n"
                f"প্রাপক: {draft.get('recipient_name')}\n"
                f"ঠিকানা: {draft.get('address')}, {draft.get('city')}\n"
                f"মোট মূল্য: ৳{draft.get('total', 0):.0f} (ক্যাশ অন ডেলিভারি)\n\n"
                f"অর্ডারটি চূড়ান্ত করতে 'হ্যাঁ, অর্ডার নিশ্চিত করছি' লিখুন।"
            )
        if state["products"]:
            return (
                f"আমাদের চমৎকার কিছু কালেকশন নিচে যুক্ত করে দেওয়া হলো! "
                f"পছন্দমতো পোশাকে সরাসরি 'কার্টে নিন' বাটনে চাপ দিয়ে সহজেই অর্ডার করতে পারেন:"
            )
        if state["order"]:
            return (
                f"আপনার অর্ডার নম্বর **{state['order'].get('order_number')}** ট্র্যাক করা হয়েছে। "
                f"বর্তমান স্ট্যাটাস: **{state['order'].get('status_title')}** ({state['order'].get('status_desc')})।"
            )
        # Grounded keyword responses for fallback
        low = (message or "").lower()
        inside = float(store_context.get("delivery_inside_dhaka", 60))
        outside = float(store_context.get("delivery_outside_dhaka", 120))
        phone = store_context.get("phone", "+880 1700-000000")

        if any(w in low for w in ["delivery", "ডেলিভারি", "চার্জ", "charge", "সময়", "সময়", "shomoy", "koto din", "কত দিন", "কত লাগবে"]):
            return (
                f"আমাদের ডেলিভারি চার্জ ঢাকার ভেতরে ৳{inside:.0f} এবং ঢাকার বাইরে ৳{outside:.0f}।\n"
                f"সাধারণত ঢাকার ভেতরে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩-৫ কার্যদিবসে ডেলিভারি সম্পন্ন হয়।"
            )

        if any(w in low for w in ["return", "exchange", "রিটার্ন", "এক্সচেঞ্জ", "বদলা", "পরিবর্তন", "সাইজ না হলে"]):
            return (
                f"সাইজ বা মানজনিত সমস্যার জন্য পণ্যটি অক্ষত ও ট্যাগ লাগানো অবস্থায় এক্সচেঞ্জ সুবিধা রয়েছে।\n"
                f"বিস্তারিত প্রক্রিয়া জানতে অনুগ্রহ করে আমাদের হেল্পলাইনে ({phone}) যোগাযোগ করুন।"
            )

        if any(w in low for w in ["phone", "ফোন", "নাম্বার", "হেল্পলাইন", "যোগাযোগ", "ঠিকানা", "location", "address"]):
            addr = store_context.get("address", "Dhaka, Bangladesh")
            return f"আমাদের ঠিকানা: {addr}। প্রয়োজনে সরাসরি যোগাযোগ করুন আমাদের হেল্পলাইনে: {phone}।"

        return (
            f"Kids & Family-তে আপনাকে স্বাগতম! 🌸 আমাদের কালেকশন, সাইজ বা ডেলিভারি নিয়ে যেকোনো জিজ্ঞাসা জানাতে পারেন, "
            f"সাহায্য করতে পেরে আনন্দিত হব।"
        )

    @classmethod
    def _fallback_response(cls, message: str, history, session_key, user, store_context: dict) -> dict:
        """Safe fallback to legacy logic if LLM service is completely unreachable."""
        try:
            from apps.ai_assistant.services import _legacy_handle_chat_turn
            res = _legacy_handle_chat_turn(
                message=message,
                history=history,
                session_key=session_key,
                user=user,
            )
            # Ensure standard contract fields exist
            res.setdefault("order_created", False)
            res.setdefault("cart_updated", False)
            res.setdefault("added_product_id", None)
            res.setdefault("order_draft", None)
            res.setdefault("order_confirmation_requested", False)
            return res
        except Exception as e:
            logger.error(f"[Agent Orchestrator] Fallback error: {e}")
            from apps.ai_assistant.services import find_recommended_products
            prods = find_recommended_products(message, history=history, limit=4)
            return {
                "success": True,
                "reply": "Kids & Family-তে স্বাগতম! আপনার পছন্দের পোশাকের কালেকশন দেখতে নিচে লক্ষ্য করুন অথবা হেল্পলাইনে যোগাযোগ করুন।",
                "products": prods,
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "fallback",
            }
