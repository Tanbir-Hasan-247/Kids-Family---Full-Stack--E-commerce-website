from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)
from .services import resolve_cart, merge_guest_cart_into_user_cart
from apps.products.models import ProductVariant


def get_or_create_cart(request):
    """
    Backward-compatible entry point delegating to resolve_cart().
    Returns (cart, token_to_return).
    """
    return resolve_cart(request)


def load_cart_optimized(cart_id):
    return Cart.objects.prefetch_related(
        "items__variant__product",
        "items__variant__attributes__attribute_type",
    ).get(pk=cart_id)


class CartDetailAPIView(APIView):
    """
    Retrieve current cart details, items, count, and total amount.
    Supports both logged-in users and cryptographically verified guest sessions.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart, new_session_token = resolve_cart(request)
        cart = load_cart_optimized(cart.pk)
        serializer = CartSerializer(cart, context={"request": request})
        data = serializer.data
        response = Response(data, status=status.HTTP_200_OK)
        if new_session_token:
            response["X-Session-Key"] = new_session_token
        return response


class AddToCartAPIView(APIView):
    """
    Add a product variant to the cart.
    Payload: { "variant_id": 1, "quantity": 1 }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant_id = serializer.validated_data["variant_id"]
        quantity = serializer.validated_data["quantity"]

        variant = get_object_or_404(ProductVariant, pk=variant_id)

        if variant.stock < 1:
            return Response(
                {"success": False, "message": "This item is out of stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart, new_session_token = resolve_cart(request)

        item, created = CartItem.objects.get_or_create(
            cart=cart, variant=variant, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        # Cap at available stock
        if item.quantity > variant.stock:
            item.quantity = variant.stock
            item.save()

        cart_data = CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data
        response = Response(
            {
                "success": True,
                "message": "Added to bag successfully.",
                "cart": cart_data,
                "item": CartItemSerializer(item).data,
            },
            status=status.HTTP_200_OK,
        )
        if new_session_token:
            response["X-Session-Key"] = new_session_token
        return response


class UpdateCartItemAPIView(APIView):
    """
    Update cart item quantity.
    Payload:
    - { "action": "increase" }
    - { "action": "decrease" }
    - { "action": "set", "quantity": 3 }
    """
    permission_classes = [permissions.AllowAny]

    def patch(self, request, item_id):
        cart, new_session_token = resolve_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data.get("action")
        direct_quantity = serializer.validated_data.get("quantity")

        if action == "increase":
            if item.quantity < item.variant.stock:
                item.quantity += 1
                item.save()
            else:
                return Response(
                    {"success": False, "message": f"Only {item.variant.stock} in stock."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif action == "decrease":
            item.quantity -= 1
            if item.quantity < 1:
                item.delete()
                resp = Response({
                    "success": True,
                    "removed": True,
                    "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
                })
                if new_session_token:
                    resp["X-Session-Key"] = new_session_token
                return resp
            item.save()
        elif action == "set" or direct_quantity is not None:
            new_qty = direct_quantity or 1
            if new_qty > item.variant.stock:
                new_qty = item.variant.stock
            item.quantity = new_qty
            item.save()

        resp = Response({
            "success": True,
            "removed": False,
            "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
            "item": CartItemSerializer(item).data,
        })
        if new_session_token:
            resp["X-Session-Key"] = new_session_token
        return resp


class RemoveCartItemAPIView(APIView):
    """
    Remove an item completely from the cart.
    """
    permission_classes = [permissions.AllowAny]

    def delete(self, request, item_id):
        cart, new_session_token = resolve_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        resp = Response({
            "success": True,
            "message": "Item removed from cart.",
            "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
        })
        if new_session_token:
            resp["X-Session-Key"] = new_session_token
        return resp


class ClearCartAPIView(APIView):
    """
    Clear all items from the current cart.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart, new_session_token = resolve_cart(request)
        cart.items.all().delete()
        resp = Response({
            "success": True,
            "message": "Cart cleared.",
            "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
        })
        if new_session_token:
            resp["X-Session-Key"] = new_session_token
        return resp


class MergeGuestCartAPIView(APIView):
    """
    Merges items from a guest cart into the logged-in user's cart.
    Payload: { "guest_session_key": "..." }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        guest_key = request.data.get("guest_session_key")
        if not guest_key:
            return Response(
                {"message": "guest_session_key is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_cart, stats = merge_guest_cart_into_user_cart(guest_key, request.user)
        if stats.get("status") in ("not_found", "invalid_key"):
            return Response({"message": "Guest cart not found or already merged."})

        return Response({
            "success": True,
            "message": "Guest cart merged successfully.",
            "cart": CartSerializer(load_cart_optimized(user_cart.pk), context={"request": request}).data,
        })
