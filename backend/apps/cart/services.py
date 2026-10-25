import logging
import re
import uuid
from typing import Optional, Tuple
from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import IntegrityError, transaction
from .models import Cart, CartItem

logger = logging.getLogger(__name__)

GUEST_CART_SALT = "guest_cart"
# 14-day validity for signed guest tokens
MAX_GUEST_CART_AGE = 14 * 86400
LEGACY_UUID_REGEX = re.compile(r"^[a-f0-9]{32}$", re.IGNORECASE)
SAFE_GUEST_KEY_REGEX = re.compile(r"^[-a-zA-Z0-9_]{8,40}$")


def get_guest_cart_signer() -> TimestampSigner:
    return TimestampSigner(salt=GUEST_CART_SALT)


def sign_guest_cart_key(raw_session_key: str) -> str:
    """
    Cryptographically signs a raw session key with timestamp.
    """
    signer = get_guest_cart_signer()
    return signer.sign(raw_session_key)


def unsign_guest_cart_token(token: str) -> Optional[str]:
    """
    Validates cryptographic signature and age of a guest cart token.
    Returns the raw session key if valid, or None if tampered/expired.
    """
    if not token or not isinstance(token, str):
        return None

    signer = get_guest_cart_signer()
    try:
        raw_key = signer.unsign(token, max_age=MAX_GUEST_CART_AGE)
        return raw_key
    except (BadSignature, SignatureExpired):
        return None


def extract_raw_guest_key(token_or_key: str) -> Tuple[Optional[str], bool]:
    """
    Extracts raw session key from either:
    1. A valid signed token (raw_key:timestamp:signature) -> returns (raw_key, is_legacy=False)
    2. A client-generated guest session key (e.g. guest_alphanumeric) -> returns (raw_key, is_legacy=True)
    3. A legacy 32-character hex UUID existing in Cart_cart -> returns (raw_key, is_legacy=True)
    4. Any safe existing session key in Cart_cart -> returns (raw_key, is_legacy=True)
    Returns (None, False) if invalid or untrusted.
    """
    if not token_or_key or not isinstance(token_or_key, str):
        return None, False

    token_clean = token_or_key.strip()

    # 1. Primary: Verify HMAC signature
    raw_key = unsign_guest_cart_token(token_clean)
    if raw_key:
        return raw_key, False

    # 2. Client-generated guest session key (e.g. guest_s1q7x4p89km23za)
    if token_clean.startswith("guest_") and SAFE_GUEST_KEY_REGEX.match(token_clean):
        return token_clean, True

    # 3. Migration Grace Period: Check for existing legacy 32-char hex UUID in DB
    if LEGACY_UUID_REGEX.match(token_clean):
        if Cart.objects.filter(session_key=token_clean, user=None).exists():
            return token_clean, True

    # 4. Any other safe session key currently active in database
    if SAFE_GUEST_KEY_REGEX.match(token_clean):
        if Cart.objects.filter(session_key=token_clean, user=None).exists():
            return token_clean, True

    return None, False


def resolve_cart(request) -> Tuple[Cart, Optional[str]]:
    """
    Centralized cart resolution for authenticated users and guests.
    Guarantees:
    - Authenticated users are bound to their user cart.
    - Guests must supply a valid cryptographically signed token, a valid guest session key,
      or valid legacy UUID.
    - Untrusted, forged, or missing keys result in a fresh cryptographically signed key.
    Returns (cart, token_to_return_in_response_header).
    `token_to_return_in_response_header` is populated if a new token was issued or an upgrade occurred.
    """
    # Authenticated user flow
    if getattr(request, "user", None) and request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart, None

    # Guest flow
    query_dict = getattr(request, "query_params", getattr(request, "GET", {}))
    query_session_key = query_dict.get("session_key") if hasattr(query_dict, "get") else None

    # Safe DRF request.data inspection
    body_session_key = None
    try:
        data_dict = getattr(request, "data", None)
        if isinstance(data_dict, dict):
            body_session_key = data_dict.get("session_key") or data_dict.get("guest_session_key")
    except Exception:
        pass

    header_key = request.headers.get("X-Session-Key") or request.headers.get("x-session-key")

    candidate_token = (
        header_key
        or body_session_key
        or query_session_key
        or getattr(getattr(request, "session", None), "session_key", None)
    )

    raw_key = None
    needs_new_token = False

    if candidate_token:
        raw_key, is_legacy = extract_raw_guest_key(candidate_token)
        if raw_key:
            if is_legacy:
                # Upgrade legacy client to cryptographically signed token
                needs_new_token = True
        else:
            # Token was invalid, forged, or expired; reject and issue new key
            needs_new_token = True
    else:
        needs_new_token = True

    if not raw_key:
        # Establish Django session if available
        if hasattr(request, "session"):
            if not request.session.session_key:
                try:
                    request.session.save()
                except Exception:
                    pass
            raw_key = request.session.session_key or uuid.uuid4().hex[:32]
        else:
            raw_key = uuid.uuid4().hex[:32]

        needs_new_token = True

    try:
        cart, _ = Cart.objects.get_or_create(session_key=raw_key, user=None)
    except IntegrityError:
        cart = Cart.objects.get(session_key=raw_key, user=None)

    token_to_return = sign_guest_cart_key(raw_key) if needs_new_token else None

    return cart, token_to_return


@transaction.atomic
def merge_guest_cart_into_user_cart(guest_token_or_key: str, user) -> Tuple[Cart, dict]:
    """
    Atomically merges items from a guest cart into the logged-in user's cart.
    Guarantees:
    - Atomicity & row locking on both guest and user carts.
    - Never leaves invalid zero-quantity items.
    - Excludes deleted or zero-stock variants.
    - Caps quantities at variant stock.
    - Purges guest cart record immediately upon successful merge.
    """
    raw_key, _ = extract_raw_guest_key(guest_token_or_key)
    if not raw_key:
        # Check if the caller passed raw_key directly (e.g., from an internal session context)
        if Cart.objects.filter(session_key=guest_token_or_key, user=None).exists():
            raw_key = guest_token_or_key

    # Retrieve target user cart with lock
    try:
        with transaction.atomic():
            user_cart, _ = Cart.objects.select_for_update().get_or_create(user=user)
    except IntegrityError:
        user_cart = Cart.objects.select_for_update().get(user=user)

    if not raw_key:
        return user_cart, {"status": "invalid_key", "merged": 0, "dropped": 0}

    # Lock guest cart
    guest_cart = Cart.objects.select_for_update().filter(session_key=raw_key, user=None).first()
    if not guest_cart:
        return user_cart, {"status": "not_found", "merged": 0, "dropped": 0}

    merged_count = 0
    dropped_count = 0

    # Process each guest item under lock
    guest_items = list(guest_cart.items.select_related("variant__product").all())
    for item in guest_items:
        variant = item.variant
        # 1. Drop if variant was deleted or is completely out of stock
        if not variant or variant.stock <= 0:
            item.delete()
            dropped_count += 1
            continue

        existing_user_item = user_cart.items.select_for_update().filter(variant=variant).first()
        if existing_user_item:
            # Overlapping variant: merge quantities capped at available stock
            max_allowed = variant.stock
            new_qty = min(existing_user_item.quantity + item.quantity, max_allowed)
            if new_qty > 0:
                existing_user_item.quantity = new_qty
                existing_user_item.save(update_fields=["quantity"])
                merged_count += 1
            else:
                existing_user_item.delete()
                dropped_count += 1
            # Remove guest copy
            item.delete()
        else:
            # Non-overlapping variant: transfer to user cart capped at stock
            transfer_qty = min(item.quantity, variant.stock)
            if transfer_qty > 0:
                item.cart = user_cart
                item.quantity = transfer_qty
                item.save(update_fields=["cart", "quantity"])
                merged_count += 1
            else:
                item.delete()
                dropped_count += 1

    # Immediate revocation: delete the guest cart record entirely
    guest_cart.delete()

    return user_cart, {"status": "success", "merged": merged_count, "dropped": dropped_count}

