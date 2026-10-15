import uuid
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
from apps.products.models import ProductVariant


def get_or_create_cart(request):
    """
    Finds or creates a cart for authenticated user or guest.
    Guest identification order:
    1. Header: X-Session-Key
    2. Query param: ?session_key=...
    3. Django session key
    4. Auto-generated UUID key
    """
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart, None

    session_key = (
        request.headers.get("X-Session-Key")
        or request.query_params.get("session_key")
        or request.session.session_key
    )

    is_new_session = False
    if not session_key:
        session_key = str(uuid.uuid4())[:32]
        is_new_session = True

    cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
    return cart, session_key if is_new_session else None


def load_cart_optimized(cart_id):
    return Cart.objects.prefetch_related(
        "items__variant__product",
        "items__variant__attributes__attribute_type",
    ).get(pk=cart_id)


class CartDetailAPIView(APIView):
    """
    Retrieve current cart details, items, count, and total amount.
    Supports both logged-in users and guest sessions.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart, new_session_key = get_or_create_cart(request)
        cart = load_cart_optimized(cart.pk)
        serializer = CartSerializer(cart, context={"request": request})
        data = serializer.data
        response = Response(data, status=status.HTTP_200_OK)
        if new_session_key:
            response["X-Session-Key"] = new_session_key
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

        cart, new_session_key = get_or_create_cart(request)

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
        if new_session_key:
            response["X-Session-Key"] = new_session_key
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
        cart, _ = get_or_create_cart(request)
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
                return Response({
                    "success": True,
                    "removed": True,
                    "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
                })
            item.save()
        elif action == "set" or direct_quantity is not None:
            new_qty = direct_quantity or 1
            if new_qty > item.variant.stock:
                new_qty = item.variant.stock
            item.quantity = new_qty
            item.save()

        return Response({
            "success": True,
            "removed": False,
            "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
            "item": CartItemSerializer(item).data,
        })


class RemoveCartItemAPIView(APIView):
    """
    Remove an item completely from the cart.
    """
    permission_classes = [permissions.AllowAny]

    def delete(self, request, item_id):
        cart, _ = get_or_create_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        return Response({
            "success": True,
            "message": "Item removed from cart.",
            "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
        })


class ClearCartAPIView(APIView):
    """
    Clear all items from the current cart.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart, _ = get_or_create_cart(request)
        cart.items.all().delete()
        return Response({
            "success": True,
            "message": "Cart cleared.",
            "cart": CartSerializer(load_cart_optimized(cart.pk), context={"request": request}).data,
        })


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

        guest_cart = Cart.objects.filter(session_key=guest_key, user=None).first()
        if not guest_cart:
            return Response({"message": "Guest cart not found or already merged."})

        user_cart, _ = Cart.objects.get_or_create(user=request.user)

        for item in guest_cart.items.select_related("variant").all():
            existing = CartItem.objects.filter(cart=user_cart, variant=item.variant).first()
            if existing:
                existing.quantity += item.quantity
                existing.save()
            else:
                item.cart = user_cart
                item.save()

        guest_cart.delete()
        return Response({
            "success": True,
            "message": "Guest cart merged successfully.",
            "cart": CartSerializer(load_cart_optimized(user_cart.pk), context={"request": request}).data,
        })

