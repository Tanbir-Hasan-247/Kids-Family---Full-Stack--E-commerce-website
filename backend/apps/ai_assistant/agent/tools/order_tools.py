import re
"""
Order Operations Tools & Draft State Machine for AI Shopping Agent.
Safe tracking with dual-key authentication, server-grounded draft preparation,
and atomic confirmation with price/stock revalidation.
"""

import hmac
import hashlib
import logging
import secrets
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.conf import settings
from django.db import transaction, IntegrityError
from django.db import models
from django.utils import timezone
from apps.orders.models import Order, OrderItem
from apps.cart.models import Cart
from apps.cart.services import resolve_cart, extract_raw_guest_key
from apps.products.models import ProductVariant
from apps.dashboard.models import ShopSetting
from apps.ai_assistant.services import (
    normalize_bengali_digits,
    resolve_district_and_delivery_zone,
)

logger = logging.getLogger(__name__)

DRAFT_TTL_MINUTES = 15
CANONICAL_BD_PHONE_REGEX = r"^01[3-9]\d{8}$"


def _normalize_phone_number(raw_phone: str) -> Optional[str]:
    """Normalizes Bengali/English numerals into canonical 11-digit BD mobile format."""
    if not raw_phone:
        return None
    import re
    # 1. Translate Bengali digits to ASCII
    bengali_to_ascii = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
    cleaned = str(raw_phone).translate(bengali_to_ascii)
    # 2. Strip whitespace and non-digit separators
    cleaned = re.sub(r"[\s\-\(\)\.]+", "", cleaned)
    # 3. Canonicalize prefix
    if cleaned.startswith("+880"):
        cleaned = "0" + cleaned[4:]
    elif cleaned.startswith("880"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("+88"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("88"):
        cleaned = "0" + cleaned[2:]
    elif re.match(r"^1[3-9]\d{8}$", cleaned):
        cleaned = "0" + cleaned

    if re.match(CANONICAL_BD_PHONE_REGEX, cleaned):
        return cleaned
    return None


STATUS_MAP = {
    "pending": {"title": "অর্ডার গৃহীত (পর্যালোচনাধীন)", "step": 1, "desc": "অর্ডারটি সফলভাবে জমা হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমাণ।"},
    "confirmed": {"title": "কনফার্মড", "step": 2, "desc": "অর্ডারটি নিশ্চিত করা হয়েছে এবং প্রস্তুত হচ্ছে।"},
    "processing": {"title": "প্রসেসিং", "step": 3, "desc": "আপনার পার্সেলটি প্যাকিং করা হচ্ছে।"},
    "shipped": {"title": "শিপড (কুরিয়ারে হস্তান্তর)", "step": 4, "desc": "পার্সেলটি কুরিয়ারে দেওয়া হয়েছে, দ্রুত ডেলিভারি হবে।"},
    "delivered": {"title": "ডেলিভারি সম্পন্ন", "step": 5, "desc": "পার্সেলটি সফলভাবে আপনার হাতে পৌঁছে দেওয়া হয়েছে।"},
    "cancelled": {"title": "বাতিল করা হয়েছে", "step": 0, "desc": "অর্ডারটি বাতিল করা হয়েছে।"},
}


def format_order_card(order: Order) -> Dict[str, Any]:
    """Formats full order details conforming to React ChatOrderCard and ChatOrderCreatedCard."""
    status_info = STATUS_MAP.get(
        order.status,
        {"title": order.status.title(), "step": 1, "desc": "অর্ডার পর্যালোচনাধীন।"}
    )
    masked_phone = order.phone[:3] + "****" + order.phone[-4:] if len(order.phone) >= 7 else "[REDACTED]"

    clean_city = order.city or ""
    if clean_city.lower() in ["outside dhaka", "inside dhaka"]:
        full_addr = order.address_line
    elif clean_city and clean_city.lower() not in order.address_line.lower():
        full_addr = f"{order.address_line}, {clean_city}"
    else:
        full_addr = order.address_line

    items = []
    for item in order.items.all():
        items.append({
            "product_name": item.product_name,
            "quantity": item.quantity,
            "price": float(item.price),
            "variant_sku": item.variant_sku,
        })

    return {
        "order_number": order.order_number,
        "full_name": order.full_name,
        "phone": masked_phone,
        "address": full_addr,
        "city": order.city,
        "status": order.status,
        "status_title": status_info["title"],
        "status_desc": status_info["desc"],
        "step": status_info["step"],
        "total": float(order.total),
        "subtotal": float(order.subtotal),
        "shipping_fee": float(order.shipping_fee),
        "payment_method": "ক্যাশ অন ডেলিভারি" if order.payment_method == "cod" else "অনলাইন পেমেন্ট",
        "payment_status": "পরিশোধিত" if order.payment_status == "paid" else "অপরিশোধিত",
        "created_at": order.created_at.strftime("%d %b %Y, %I:%M %p"),
        "items": items,
    }


def execute_track_order(
    order_number: str = "",
    phone: str = "",
    user=None,
    session_key: Optional[str] = None,
    **kwargs,
) -> Dict[str, Any]:
    """
    Secure order tracking with BOLA/IDOR protection.
    Supports lookup by order number or customer phone number.
    Auto-detects phone number if passed in order_number parameter.
    """
    clean_order_num = str(order_number or "").strip().upper()
    raw_phone = str(phone or "").strip()

    # Smart auto-detection: If order_number is actually a BD mobile number
    clean_digits = re.sub(r"\D", "", clean_order_num)
    if not raw_phone and len(clean_digits) in (10, 11) and re.match(r"^(?:0)?1[3-9]\d{8}$", clean_digits):
        raw_phone = clean_digits
        clean_order_num = ""

    norm_phone = _normalize_phone_number(raw_phone)

    if not clean_order_num and not norm_phone:
        return {
            "success": False,
            "error": "অনুগ্রহ করে আপনার অর্ডার নম্বর (যেমন: KF2610251234) অথবা ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।",
        }

    order = None
    if clean_order_num:
        order = Order.objects.filter(order_number=clean_order_num).first()
        if not order:
            return {
                "success": False,
                "error": f"'{clean_order_num}' নম্বরের কোনো অর্ডার খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার নম্বর দিন।",
            }
        is_authorized = False
        if user and getattr(user, "is_authenticated", False):
            if user.is_staff or order.user == user:
                is_authorized = True

        if not is_authorized:
            # For guest or non-owner: strictly require matching phone number
            order_norm_phone = _normalize_phone_number(order.phone)
            if norm_phone and order_norm_phone and norm_phone == order_norm_phone:
                is_authorized = True

        if not is_authorized:
            return {
                "success": False,
                "error": "নিরাপত্তাজনিত কারণে অর্ডার ট্র্যাক করতে অর্ডারের সময় ব্যবহৃত সঠিক ফোন নাম্বার প্রদান করা আবশ্যক।",
            }
    elif norm_phone:
        from django.db.models import Q
        matching_orders = list(
            Order.objects.filter(
                Q(phone=norm_phone) | Q(phone=f"+88{norm_phone}") | Q(phone=f"88{norm_phone}")
            ).order_by("-created_at")[:6]
        )
        if not matching_orders:
            return {
                "success": False,
                "error": f"'{norm_phone}' মোবাইল নম্বরে কোনো অর্ডার খুঁজে পাওয়া যায়নি।",
            }
        order = matching_orders[0]
        multiple_orders_summary = []
        if len(matching_orders) > 1:
            for o in matching_orders:
                multiple_orders_summary.append({
                    "order_number": o.order_number,
                    "status": o.status,
                    "total": float(o.total),
                    "created_at": o.created_at.strftime("%d %b, %Y") if hasattr(o, "created_at") and o.created_at else "",
                })

    order_card = format_order_card(order)
    return {
        "success": True,
        "order_number": order.order_number,
        "order": order_card,
        "multiple_orders": multiple_orders_summary if 'multiple_orders_summary' in locals() else [],
        "status": order.status,
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
        "total": float(order.total),
        "phone": order_card["phone"],
        "city": order.city,
        "created_at": order_card["created_at"],
        "items": [f"{item['quantity']} x {item['product_name']}" for item in order_card["items"]],
    }


def execute_prepare_order_draft(
    recipient_name: str = "",
    phone: str = "",
    address: str = "",
    city: str = "Dhaka",
    variant_ids: Optional[List[int]] = None,
    quantities: Optional[List[int]] = None,
    payment_method: str = "cod",
    request=None,
    user=None,
    session_key: Optional[str] = None,
    **kwargs,
) -> Dict[str, Any]:
    """
    State 1 of Conversational Order: Prepares a verified OrderDraft.
    Calculates live prices and delivery charges strictly from the database.
    Does NOT finalize or create an Order.
    """
    clean_name = str(recipient_name or "").strip()
    norm_phone = _normalize_phone_number(phone)
    clean_address = str(address or "").strip()
    clean_city = str(city or "Dhaka").strip()

    if not clean_name:
        return {"success": False, "error": "প্রাপকের পুরো নাম (Recipient Name) প্রয়োজন।"}
    if not norm_phone:
        return {"success": False, "error": "সঠিক ১১ ডিজিটের মোবাইল নাম্বার প্রদান করুন (যেমন: 017XXXXXXXX)।"}
    if not clean_address:
        return {"success": False, "error": "সম্পূর্ণ ডেলিভারি ঠিকানা (ডেলিভারি এরিয়া ও রোড) প্রয়োজন।"}

    # Resolve items: from explicit parameters or active cart
    items_to_order: List[Dict[str, Any]] = []

    if variant_ids and quantities and len(variant_ids) == len(quantities):
        for v_id, qty in zip(variant_ids, quantities):
            try:
                items_to_order.append({"variant_id": int(v_id), "quantity": max(1, int(qty))})
            except (ValueError, TypeError):
                continue
    else:
        # Fall back to active cart
        cart = None
        if request:
            cart, _ = resolve_cart(request)
        elif user and getattr(user, "is_authenticated", False):
            cart = Cart.objects.filter(user=user).first()
        elif session_key:
            raw_k, _ = extract_raw_guest_key(session_key)
            target_key = raw_k or session_key
            cart = Cart.objects.filter(session_key=target_key, user=None).first()

        if cart:
            for item in cart.items.select_related("variant__product").all():
                if item.variant and item.quantity > 0:
                    items_to_order.append({
                        "variant_id": item.variant_id,
                        "quantity": item.quantity,
                    })

    if not items_to_order:
        return {
            "success": False,
            "error": "অর্ডার করার জন্য কোনো পণ্য নির্বাচন করা হয়নি অথবা আপনার ব্যাগটি খালি।",
        }

    # Aggregate quantities per variant_id
    aggregated = defaultdict(int)
    for item in items_to_order:
        aggregated[item["variant_id"]] += item["quantity"]

    sorted_ids = sorted(aggregated.keys())

    # Validate stock and derive live prices from DB
    validated_items = []
    subtotal = Decimal("0.00")

    for v_id in sorted_ids:
        variant = ProductVariant.objects.select_related("product").filter(id=v_id).first()
        if not variant:
            return {"success": False, "error": f"পণ্য ভ্যারিয়েন্ট ID {v_id} খুঁজে পাওয়া যায়নি।"}
        requested_qty = aggregated[v_id]
        if variant.stock < requested_qty:
            return {
                "success": False,
                "error": f"'{variant.product.name}' পর্যাপ্ত স্টকে নেই (অনুরোধ: {requested_qty}, আছে: {variant.stock})।",
            }

        item_price = variant.price
        line_total = item_price * requested_qty
        subtotal += line_total
        validated_items.append({
            "variant_id": variant.id,
            "product_name": variant.product.name,
            "variant_sku": variant.sku,
            "price": float(item_price),
            "quantity": requested_qty,
            "subtotal": float(line_total),
        })

    # Derive delivery charge from ShopSetting
    setting = ShopSetting.objects.first()
    inside_fee = Decimal(str(setting.delivery_inside_dhaka)) if setting else Decimal("60.00")
    outside_fee = Decimal(str(setting.delivery_outside_dhaka)) if setting else Decimal("120.00")

    zone_info = resolve_district_and_delivery_zone(f"{clean_city} {clean_address}")
    is_inside = zone_info.get("is_inside_dhaka", False) if isinstance(zone_info, dict) else False
    shipping_fee = inside_fee if is_inside else outside_fee
    total = subtotal + shipping_fee

    # Generate high-entropy ownership token and draft IDs
    draft_id = str(secrets.token_hex(16))
    idempotency_key = str(secrets.token_hex(20))
    raw_ownership_token = secrets.token_urlsafe(32)
    token_hash = hmac.new(settings.SECRET_KEY.encode(), raw_ownership_token.encode(), hashlib.sha256).hexdigest()

    active_session_key = session_key or (request.session.session_key if request and hasattr(request, "session") else None)

    draft_payload = {
        "draft_id": draft_id,
        "idempotency_key": idempotency_key,
        "token_hash": token_hash,
        "user_id": user.id if user and getattr(user, "is_authenticated", False) else None,
        "session_key": active_session_key,
        "recipient_name": clean_name,
        "phone": norm_phone,
        "address": clean_address,
        "city": clean_city,
        "payment_method": "cod" if payment_method.lower() != "online" else "online",
        "subtotal": float(subtotal),
        "shipping_fee": float(shipping_fee),
        "total": float(total),
        "items": validated_items,
        "status": "pending_confirmation",
        "created_at": timezone.now().isoformat(),
        "expires_at": (timezone.now() + timedelta(minutes=DRAFT_TTL_MINUTES)).isoformat(),
    }

    # Store draft in server-side session if available
    if request and hasattr(request, "session"):
        request.session["pending_order_draft"] = draft_payload
        request.session.modified = True

    return {
        "success": True,
        "draft_id": draft_id,
        "idempotency_key": idempotency_key,
        "ownership_token": raw_ownership_token,
        "order_confirmation_requested": True,
        "order_created": False,
        "order_draft": {
            "recipient_name": clean_name,
            "phone": norm_phone[:3] + "****" + norm_phone[-4:],
            "address": clean_address,
            "city": clean_city,
            "payment_method": draft_payload["payment_method"],
            "subtotal": float(subtotal),
            "shipping_fee": float(shipping_fee),
            "total": float(total),
            "items": validated_items,
            "expires_in_minutes": DRAFT_TTL_MINUTES,
        },
        "instructions": (
            f"মোট প্রদেয়: ৳{float(total):.0f} (পণ্য: ৳{float(subtotal):.0f} + ডেলিভারি: ৳{float(shipping_fee):.0f})। "
            "অর্ডারটি চূড়ান্ত করতে অনুগ্রহ করে 'হ্যাঁ, অর্ডার নিশ্চিত করছি' লিখুন অথবা স্ক্রিনের কনফার্ম বাটনে চাপ দিন।"
        ),
    }


def execute_confirm_order(
    draft_id: Optional[str] = None,
    ownership_token: Optional[str] = None,
    request=None,
    user=None,
    session_key: Optional[str] = None,
    draft_context: Optional[Dict[str, Any]] = None,
    **kwargs,
) -> Dict[str, Any]:
    """
    State 2 of Conversational Order: Confirms a pending OrderDraft.
    Revalidates live prices and stock under deterministic sorted lock.
    Enforces atomic creation and clears active cart.
    """
    # 1. Retrieve draft from session or passed draft context
    draft = None
    if request and hasattr(request, "session"):
        draft = request.session.get("pending_order_draft")

    if not draft and draft_context:
        draft = draft_context

    if not draft:
        return {
            "success": False,
            "error": "কোনো সক্রিয় অর্ডার ড্রাফট পাওয়া যায়নি। অনুগ্রহ করে পুনরায় অর্ডার করতে চান কি না জানান।",
        }

    # 2. Check draft expiry
    expires_at_str = draft.get("expires_at")
    if expires_at_str:
        from django.utils.dateparse import parse_datetime
        exp_dt = parse_datetime(expires_at_str)
        if exp_dt and timezone.now() > exp_dt:
            if request and hasattr(request, "session"):
                request.session.pop("pending_order_draft", None)
            return {
                "success": False,
                "error": "অর্ডার ড্রাফটের সময়সীমা (১৫ মিনিট) পার হয়ে গেছে। দয়া করে নতুন করে অর্ডার করুন।",
            }

    # 3. Enforce Authorization
    if user and getattr(user, "is_authenticated", False):
        if draft.get("user_id") and draft.get("user_id") != user.id:
            return {"success": False, "error": "ড্রাফটটি আপনার অ্যাকাউন্টের নয়।"}
    else:
        # Guest verification
        if ownership_token:
            comp_hash = hmac.new(settings.SECRET_KEY.encode(), ownership_token.encode(), hashlib.sha256).hexdigest()
            if not secrets.compare_digest(draft.get("token_hash", ""), comp_hash):
                return {"success": False, "error": "অবৈধ ওনারশিপ টোকেন।"}

    # 4. Idempotency Check
    idempotency_key = draft.get("idempotency_key")
    if idempotency_key:
        existing_order = (
            Order.objects.filter(idempotency_key=idempotency_key).first()
            or Order.objects.filter(notes__contains=f"[idempotency_key:{idempotency_key}]").first()
        )
        if existing_order:
            is_auth = False
            if user and getattr(user, "is_authenticated", False):
                if existing_order.user == user or user.is_staff:
                    is_auth = True
            elif existing_order.session_key and session_key and existing_order.session_key in (session_key, (extract_raw_guest_key(session_key)[0] or session_key)):
                is_auth = True
            elif ownership_token:
                comp_hash = hmac.new(settings.SECRET_KEY.encode(), ownership_token.encode(), hashlib.sha256).hexdigest()
                if existing_order.guest_token_hash and secrets.compare_digest(existing_order.guest_token_hash, comp_hash):
                    is_auth = True
                elif secrets.compare_digest(draft.get("token_hash", ""), comp_hash):
                    is_auth = True

            if is_auth:
                if request and hasattr(request, "session"):
                    request.session.pop("pending_order_draft", None)
                order_card = format_order_card(existing_order)
                return {
                    "success": True,
                    "order_created": False,
                    "is_replay": True,
                    "order_number": existing_order.order_number,
                    "order": order_card,
                    "cart_updated": False,
                    "message": (
                        f"আপনার অর্ডারটি (অর্ডার নং: {existing_order.order_number}) ইতিমধ্যে সফলভাবে গ্রহণ করা হয়েছে। "
                        f"মোট প্রদেয় ৳{float(existing_order.total):.0f} (ক্যাশ অন ডেলিভারি)।"
                    ),
                }

    # 5. Atomic Execution & Revalidation
    items = draft.get("items", [])
    if not items:
        return {"success": False, "error": "ড্রাফটে কোনো পণ্য পাওয়া যায়নি।"}

    aggregated = defaultdict(int)
    for it in items:
        aggregated[it["variant_id"]] += it["quantity"]

    sorted_ids = sorted(aggregated.keys())

    try:
        with transaction.atomic():
            # Acquire row locks on ProductVariants in strict sorted order
            locked_variants = {
                v.id: v
                for v in ProductVariant.objects.select_for_update().filter(id__in=sorted_ids).order_by("id")
            }

            # Revalidate stock and prices
            for it in items:
                v_id = it["variant_id"]
                variant = locked_variants.get(v_id)
                if not variant:
                    return {"success": False, "error": f"পণ্য ভ্যারিয়েন্ট ID {v_id} বর্তমানে অপ্রাপ্য।"}

                # Check price stability
                current_price = float(variant.price)
                draft_price = float(it["price"])
                if current_price != draft_price:
                    # Price changed since draft was generated!
                    if request and hasattr(request, "session"):
                        request.session.pop("pending_order_draft", None)
                    return {
                        "success": False,
                        "error": (
                            f"দুঃখিত, ড্রাফটের পর '{variant.product.name}'-এর মূল্যে পরিবর্তন এসেছে "
                            f"(পূর্বের মূল্য: ৳{draft_price}, বর্তমান মূল্য: ৳{current_price})। "
                            "অনুগ্রহ করে বর্তমান মূল্যে নতুন ড্রাফট নিশ্চিত করুন।"
                        ),
                    }

                # Check live stock
                if variant.stock < it["quantity"]:
                    return {
                        "success": False,
                        "error": f"দুঃখিত, '{variant.product.name}'-এর পর্যাপ্ত স্টক নেই।",
                    }

            # Create Order with enforced idempotency_key database constraint
            notes_payload = f"[idempotency_key:{idempotency_key}][draft_id:{draft.get('draft_id')}]".strip()
            order = Order.objects.create(
                user=user if user and getattr(user, "is_authenticated", False) else None,
                session_key=(
                    (extract_raw_guest_key(session_key)[0] or session_key)
                    if session_key and not (user and getattr(user, "is_authenticated", False))
                    else None
                ),
                full_name=draft["recipient_name"],
                phone=draft["phone"],
                email="",
                address_line=draft["address"],
                city=draft["city"],
                notes=notes_payload,
                idempotency_key=idempotency_key,
                guest_token_hash=draft.get("token_hash"),
                payment_method=draft.get("payment_method", "cod"),
                payment_status="unpaid",
                status="pending",
                subtotal=Decimal(str(draft["subtotal"])),
                shipping_fee=Decimal(str(draft["shipping_fee"])),
                total=Decimal(str(draft["total"])),
            )

            # Create OrderItems and deduct stock atomically
            for it in items:
                v_id = it["variant_id"]
                variant = locked_variants[v_id]
                OrderItem.objects.create(
                    order=order,
                    variant=variant,
                    product_name=it["product_name"],
                    variant_sku=it.get("variant_sku", ""),
                    price=Decimal(str(it["price"])),
                    quantity=it["quantity"],
                )
                ProductVariant.objects.filter(id=v_id).update(
                    stock=models.F("stock") - it["quantity"]
                )

            # Clear Cart
            cart = None
            if request:
                cart, _ = resolve_cart(request)
            elif user and getattr(user, "is_authenticated", False):
                cart = Cart.objects.filter(user=user).first()
            elif session_key:
                raw_k, _ = extract_raw_guest_key(session_key)
                target_key = raw_k or session_key
                cart = Cart.objects.filter(session_key=target_key, user=None).first()

            if cart:
                cart.items.all().delete()

            # Purge session draft
            if request and hasattr(request, "session"):
                request.session.pop("pending_order_draft", None)

            order_card = format_order_card(order)
            return {
                "success": True,
                "order_created": True,
                "is_replay": False,
                "order_number": order.order_number,
                "order": order_card,
                "cart_updated": True,
                "message": (
                    f"আলহামদুলিল্লাহ! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে (অর্ডার নং: {order.order_number})। "
                    f"মোট প্রদেয় ৳{float(order.total):.0f}। আমাদের টিম শীঘ্রই ডেলিভারির জন্য যোগাযোগ করবে।"
                ),
            }

    except IntegrityError as ie:
        logger.error(f"[execute_confirm_order] Database integrity error / concurrent conflict: {ie}")
        if idempotency_key:
            existing_order = (
                Order.objects.filter(idempotency_key=idempotency_key).first()
                or Order.objects.filter(notes__contains=f"[idempotency_key:{idempotency_key}]").first()
            )
            if existing_order:
                # Enforce authorization before returning existing order
                is_auth = False
                if user and getattr(user, "is_authenticated", False):
                    if existing_order.user == user or user.is_staff:
                        is_auth = True
                elif existing_order.session_key and session_key and existing_order.session_key in (session_key, (extract_raw_guest_key(session_key)[0] or session_key)):
                    is_auth = True
                elif ownership_token:
                    comp_hash = hmac.new(settings.SECRET_KEY.encode(), ownership_token.encode(), hashlib.sha256).hexdigest()
                    if existing_order.guest_token_hash and secrets.compare_digest(existing_order.guest_token_hash, comp_hash):
                        is_auth = True
                    elif secrets.compare_digest(draft.get("token_hash", ""), comp_hash):
                        is_auth = True

                if is_auth:
                    if request and hasattr(request, "session"):
                        request.session.pop("pending_order_draft", None)
                    order_card = format_order_card(existing_order)
                    return {
                        "success": True,
                        "order_created": False,
                        "is_replay": True,
                        "order_number": existing_order.order_number,
                        "order": order_card,
                        "cart_updated": False,
                        "message": (
                            f"আপনার অর্ডারটি (অর্ডার নং: {existing_order.order_number}) ইতিমধ্যে সফলভাবে গ্রহণ করা হয়েছে। "
                            f"মোট প্রদেয় ৳{float(existing_order.total):.0f} (ক্যাশ অন ডেলিভারি)।"
                        ),
                    }
        return {"success": False, "error": "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে হেল্পলাইনে যোগাযোগ করুন।"}
