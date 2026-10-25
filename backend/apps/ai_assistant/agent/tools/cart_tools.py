"""
Cart Operations Tools for AI Shopping Agent.
Safe additions, deletions, and inspection of active shopping cart.
Reuses centralized resolve_cart() service from apps.cart.services.
"""

import logging
from typing import Dict, Any, Optional
from django.db import transaction
from apps.cart.models import Cart, CartItem
from apps.cart.services import resolve_cart, extract_raw_guest_key
from apps.products.models import ProductVariant

logger = logging.getLogger(__name__)


def _get_cart_from_context(request=None, user=None, session_key=None) -> Optional[Cart]:
    """Resolves active cart strictly from trusted server context."""
    if request:
        cart, _ = resolve_cart(request)
        return cart

    if user and getattr(user, "is_authenticated", False):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    if session_key:
        raw_k, _ = extract_raw_guest_key(session_key)
        target_key = raw_k or session_key
        cart, _ = Cart.objects.get_or_create(session_key=target_key, user=None)
        return cart

    return None


def execute_manage_cart(
    action: str = "get",
    variant_id: Optional[int] = None,
    product_id: Optional[int] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    quantity: int = 1,
    request=None,
    user=None,
    session_key=None,
    **kwargs,
) -> Dict[str, Any]:
    """
    Manages active customer shopping cart based on action: 'get', 'add', 'remove', 'clear'.
    Enforces authorization strictly through verified server context.
    Validates color, size, availability, and stock against real database records.
    """
    clean_action = str(action or "get").lower().strip()
    cart = _get_cart_from_context(request=request, user=user, session_key=session_key)

    if not cart:
        logger.warning(
            f"[CartOperation] No active shopping session: session_key={session_key[:8] if session_key else 'None'}, user_auth={bool(user and user.is_authenticated)}"
        )
        return {
            "success": False,
            "error_code": "no_active_session",
            "error": "No active shopping session found.",
            "cart_items": [],
            "total_price": 0.0,
        }

    # 1. Action: GET cart contents
    if clean_action == "get":
        items_data = []
        for item in cart.items.select_related("variant__product").prefetch_related("variant__attributes__attribute_type").all():
            v = item.variant
            v_color = next((a.value for a in v.attributes.all() if "color" in a.attribute_type.name.lower() or "রং" in a.attribute_type.name.lower()), "")
            v_size = next((a.value for a in v.attributes.all() if "size" in a.attribute_type.name.lower()), "")
            items_data.append({
                "item_id": item.id,
                "variant_id": item.variant_id,
                "product_id": v.product_id,
                "product_name": v.product.name,
                "sku": v.sku,
                "color": v_color,
                "size": v_size,
                "price": float(v.price),
                "quantity": item.quantity,
                "subtotal": float(item.subtotal),
                "stock": v.stock,
            })
        return {
            "success": True,
            "action": "get",
            "items": items_data,
            "total_items": cart.total_items,
            "total_price": float(cart.total_price),
        }

    # 2. Action: ADD item to cart
    elif clean_action == "add":
        variant = None
        target_product_id = product_id or kwargs.get("product_id")

        # Resolve variant
        if variant_id is not None:
            try:
                variant = (
                    ProductVariant.objects.select_related("product")
                    .prefetch_related("attributes__attribute_type")
                    .filter(id=int(variant_id), product__is_active=True)
                    .first()
                )
            except (ValueError, TypeError):
                variant = None

            if not variant:
                logger.warning(f"[CartOperation] Explicit variant_id={variant_id} not found or product inactive")
                return {
                    "success": False,
                    "error_code": "variant_not_found",
                    "error": "নির্বাচিত ভ্যারিয়েন্টটি খুঁজে পাওয়া যায়নি বা বর্তমানে অনুপলব্ধ।",
                }

        elif target_product_id:
            from .product_tools import resolve_variant_for_product

            resolution = resolve_variant_for_product(
                product_id=target_product_id,
                color=color,
                size=size,
            )

            if not resolution.get("success"):
                reason = resolution.get("reason")
                logger.warning(
                    f"[CartOperation] Variant resolution failed: reason={reason}, product_id={target_product_id}, "
                    f"color={color}, size={size}, session_id={session_key[:8] if session_key else 'auth'}"
                )
                p_name = resolution.get("product_name") or (
                    resolution.get("product").name if resolution.get("product") else "পণ্যটি"
                )

                if reason == "variant_not_found":
                    conf_lines = []
                    conf_opts = resolution.get("confirmed_options", {})
                    for c_name, sz_list in conf_opts.items():
                        if sz_list:
                            conf_lines.append(f"• **{c_name}** কালারে: সাইজ **{', '.join(sz_list)}**")
                        else:
                            conf_lines.append(f"• **{c_name}** কালার")
                    opts_str = "\n".join(conf_lines) if conf_lines else "বর্তমানে অন্য কোনো কম্বিনেশন খালি নেই।"

                    col_str = f"**{color}** কালারে " if color else ""
                    sz_str = f"**{size}** সাইজটি " if size else ""
                    msg = (
                        f"দুঃখিত, **{p_name}** পোশাকে {col_str}{sz_str}এই মুহূর্তে স্টকে নেই।\n\n"
                        f"তবে এই পোশাকে নিচের সাইজ ও কালারগুলো স্টকে অ্যাভেইলেবল রয়েছে:\n{opts_str}\n\n"
                        f"আপনি কি এর মধ্য থেকে কোনো সাইজ নিতে চান?"
                    )
                    return {
                        "success": False,
                        "error_code": "variant_unavailable",
                        "error": msg,
                        "message": msg,
                        "product_id": target_product_id,
                        "product_name": p_name,
                        "requested_color": color,
                        "requested_size": size,
                        "available_combinations": resolution.get("variants_data", []),
                        "confirmed_options": conf_opts,
                    }
                elif reason == "multiple_sizes_available":
                    sizes_str = ", ".join(resolution.get("available_sizes", []))
                    msg = f"**{p_name}**-এর **{color}** কালারে বেশ কিছু সাইজ ({sizes_str}) রয়েছে। আপনি কোন সাইজটি নিতে চান?"
                    return {
                        "success": False,
                        "error_code": "multiple_sizes_available",
                        "error": msg,
                        "message": msg,
                        "product_id": target_product_id,
                        "available_sizes": resolution.get("available_sizes", []),
                    }
                elif reason == "multiple_colors_available":
                    colors_str = ", ".join(resolution.get("available_colors", []))
                    msg = f"**{p_name}**-এর **{size}** সাইজে কয়েকটি কালার ({colors_str}) রয়েছে। আপনি কোন কালারটি নিতে চান?"
                    return {
                        "success": False,
                        "error_code": "multiple_colors_available",
                        "error": msg,
                        "message": msg,
                        "product_id": target_product_id,
                        "available_colors": resolution.get("available_colors", []),
                    }
                else:
                    return {
                        "success": False,
                        "error_code": "variant_not_found",
                        "error": f"দুঃখিত, '{p_name}'-এর কাঙ্ক্ষিত ভ্যারিয়েন্টটি খুঁজে পাওয়া যায়নি।",
                        "product_id": target_product_id,
                    }

            variant = resolution["variant"]

        else:
            logger.warning("[CartOperation] Add to cart called with missing variant_id and product_id")
            return {
                "success": False,
                "error_code": "missing_product_context",
                "error": "আপনি কোন পোশাকটি কার্টে যোগ করতে চান? অনুগ্রহ করে পোশাকটির নাম বা লিংক জানান।",
            }

        # Validate quantity and live stock immediately before mutating database
        try:
            qty = max(1, int(quantity))
        except (ValueError, TypeError):
            qty = 1

        if variant.stock < 1:
            logger.info(f"[CartOperation] Out of stock for variant_id={variant.id}, stock={variant.stock}")
            return {
                "success": False,
                "error_code": "out_of_stock",
                "error": f"দুঃখিত, **{variant.product.name}** এই মুহূর্তে স্টকে নেই।",
                "stock": 0,
                "product_id": variant.product_id,
            }

        if variant.stock < qty:
            logger.info(
                f"[CartOperation] Insufficient stock for variant_id={variant.id}, requested={qty}, available={variant.stock}"
            )
            return {
                "success": False,
                "error_code": "insufficient_stock",
                "error": f"দুঃখিত, **{variant.product.name}**-এর পর্যাপ্ত স্টক নেই (বর্তমান স্টক: {variant.stock}টি)।",
                "stock": variant.stock,
                "product_id": variant.product_id,
            }

        # Atomically mutate cart under database transaction
        with transaction.atomic():
            item, created = CartItem.objects.get_or_create(
                cart=cart, variant=variant, defaults={"quantity": qty}
            )
            if not created:
                if item.quantity + qty > variant.stock:
                    item.quantity = variant.stock
                else:
                    item.quantity += qty
                item.save()

        logger.info(
            f"[CartOperation] Successfully added variant_id={variant.id} (qty={item.quantity}) to cart_id={cart.id}"
        )

        v_color = next(
            (
                a.value
                for a in variant.attributes.all()
                if "color" in a.attribute_type.name.lower() or "রং" in a.attribute_type.name.lower()
            ),
            "",
        )
        v_size = next(
            (a.value for a in variant.attributes.all() if "size" in a.attribute_type.name.lower()),
            "",
        )
        variant_desc = (
            f" ({v_color} কালার, {v_size} সাইজ)"
            if (v_color and v_size)
            else (f" ({v_color or v_size})" if (v_color or v_size) else "")
        )

        return {
            "success": True,
            "action": "add",
            "message": f"🎉 **{variant.product.name}**{variant_desc} সফলভাবে কার্টে যোগ করা হয়েছে! 🛍️",
            "added_product_id": variant.product_id,
            "added_variant_id": variant.id,
            "variant_color": v_color,
            "variant_size": v_size,
            "quantity": item.quantity,
            "unit_price": float(variant.price),
            "total_items": cart.total_items,
            "total_price": float(cart.total_price),
            "cart_updated": True,
        }

    # 3. Action: REMOVE item from cart
    elif clean_action == "remove":
        if not variant_id:
            return {"success": False, "error": "variant_id is required to remove an item."}

        deleted_count, _ = cart.items.filter(variant_id=int(variant_id)).delete()
        return {
            "success": True,
            "action": "remove",
            "removed": deleted_count > 0,
            "total_items": cart.total_items,
            "total_price": float(cart.total_price),
            "cart_updated": True,
        }

    # 4. Action: CLEAR cart
    elif clean_action == "clear":
        cart.items.all().delete()
        return {
            "success": True,
            "action": "clear",
            "message": "Cart cleared.",
            "total_items": 0,
            "total_price": 0.0,
            "cart_updated": True,
        }

    return {"success": False, "error": f"Unknown action '{clean_action}'. Use get, add, remove, or clear."}
