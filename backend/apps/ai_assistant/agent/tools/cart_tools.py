"""
Cart Operations Tools for AI Shopping Agent.
Safe additions, deletions, and inspection of active shopping cart.
Reuses centralized resolve_cart() service from apps.cart.services.
"""

import logging
from typing import Dict, Any, Optional
from django.db import transaction
from apps.cart.models import Cart, CartItem
from apps.cart.services import resolve_cart
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
        cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
        return cart

    return None


def execute_manage_cart(
    action: str = "get",
    variant_id: Optional[int] = None,
    quantity: int = 1,
    request=None,
    user=None,
    session_key=None,
    **kwargs,
) -> Dict[str, Any]:
    """
    Manages active customer shopping cart based on action: 'get', 'add', 'remove', 'clear'.
    Enforces authorization strictly through verified server context.
    """
    clean_action = str(action or "get").lower().strip()
    cart = _get_cart_from_context(request=request, user=user, session_key=session_key)

    if not cart:
        return {
            "success": False,
            "error": "No active shopping session found.",
            "cart_items": [],
            "total_price": 0.0,
        }

    # 1. Action: GET cart contents
    if clean_action == "get":
        items_data = []
        for item in cart.items.select_related("variant__product").all():
            items_data.append({
                "item_id": item.id,
                "variant_id": item.variant_id,
                "product_name": item.variant.product.name,
                "sku": item.variant.sku,
                "price": float(item.variant.price),
                "quantity": item.quantity,
                "subtotal": float(item.subtotal),
                "stock": item.variant.stock,
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
        if variant_id:
            try:
                variant = ProductVariant.objects.select_related("product").filter(id=int(variant_id)).first()
            except (ValueError, TypeError):
                variant = None
        elif kwargs.get("product_id"):
            try:
                p_id = int(kwargs["product_id"])
                # Resolve to first in-stock variant of product
                variant = ProductVariant.objects.select_related("product").filter(product_id=p_id, stock__gt=0).first()
                if not variant:
                    variant = ProductVariant.objects.select_related("product").filter(product_id=p_id).first()
            except (ValueError, TypeError):
                variant = None

        if not variant:
            return {"success": False, "error": "A valid variant_id or product_id is required to add an item to the cart."}

        try:
            qty = max(1, int(quantity))
        except (ValueError, TypeError):
            qty = 1

        if variant.stock < 1:
            return {
                "success": False,
                "error": f"'{variant.product.name}' is out of stock.",
            }

        with transaction.atomic():
            item, created = CartItem.objects.get_or_create(
                cart=cart, variant=variant, defaults={"quantity": qty}
            )
            if not created:
                item.quantity += qty
                item.save()

            # Cap at available stock
            if item.quantity > variant.stock:
                item.quantity = variant.stock
                item.save()

        return {
            "success": True,
            "action": "add",
            "message": f"Added {item.quantity} x '{variant.product.name}' to bag.",
            "added_product_id": variant.product_id,
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
