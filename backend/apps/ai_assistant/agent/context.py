"""
Context & Conversation History Manager with Customer Isolation and PII Masking.
Prepares types.Content payloads for Gemini API while sanitizing sensitive customer data.
"""

import re
from typing import List, Tuple, Dict, Any, Optional
from google.genai import types
from apps.ai_assistant.services import (
    extract_previously_shown_product_ids,
    normalize_bengali_digits,
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
    """

    MAX_HISTORY_TURNS = 8

    @classmethod
    def sanitize_history_turn(cls, turn: Any) -> Optional[Dict[str, str]]:
        """
        Validates and sanitizes an individual conversation history entry.
        Filters out malformed entries and masks sensitive customer PII.
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

        return {"role": gemini_role, "text": masked_text}

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
