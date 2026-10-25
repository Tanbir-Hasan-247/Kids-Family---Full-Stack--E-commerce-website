from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from .models import FavoriteItem
from .serializers import FavoriteItemSerializer
from apps.products.models import Product
from apps.cart.services import extract_raw_guest_key


def get_identity(request):
    """
    Returns query filter dict for either user or session_key.
    Guarantees raw session key <= 40 chars, unsigning signed tokens if present.
    If authenticated, automatically migrates any unmerged guest favorites for this session.
    """
    raw_token = (
        request.headers.get("X-Session-Key")
        or request.headers.get("x-session-key")
        or request.query_params.get("session_key")
        or getattr(getattr(request, "session", None), "session_key", None)
    )
    target_key = None
    if raw_token:
        raw_key, _ = extract_raw_guest_key(raw_token)
        target_key = ((raw_key or raw_token).strip())[:40]

    if getattr(request, "user", None) and request.user.is_authenticated:
        # Automatically merge any guest favorites for this session into user's favorites
        if target_key:
            guest_items = list(FavoriteItem.objects.filter(session_key=target_key, user=None))
            for item in guest_items:
                if not FavoriteItem.objects.filter(user=request.user, product=item.product).exists():
                    item.user = request.user
                    item.session_key = None
                    item.save(update_fields=["user", "session_key"])
                else:
                    item.delete()
        return {"user": request.user}

    if target_key:
        return {"session_key": target_key}

    return {"session_key": "anonymous"}


class WishlistListAPIView(APIView):
    """
    List all favorited products for current user or session.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        identity = get_identity(request)
        items = (
            FavoriteItem.objects.filter(**identity)
            .select_related("product__category", "product__category__parent")
            .prefetch_related(
                "product__variants__attributes__attribute_type",
                "product__reviews",
            )
            .order_by("-added_at")
        )
        serializer = FavoriteItemSerializer(items, many=True, context={"request": request})
        return Response({
            "count": items.count(),
            "items": serializer.data,
        })


class WishlistToggleAPIView(APIView):
    """
    Toggle a product in wishlist (add if not present, remove if present).
    Path: /api/wishlist/toggle/<product_id>/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        identity = get_identity(request)

        existing = FavoriteItem.objects.filter(product=product, **identity).first()
        if existing:
            existing.delete()
            favorited = False
            message = "Removed from wishlist."
        else:
            try:
                FavoriteItem.objects.create(product=product, **identity)
            except IntegrityError:
                pass
            favorited = True
            message = "Added to wishlist."

        count = FavoriteItem.objects.filter(**identity).count()

        return Response({
            "success": True,
            "favorited": favorited,
            "count": count,
            "message": message,
        }, status=status.HTTP_200_OK)


class WishlistCheckAPIView(APIView):
    """
    Check if a specific product is favorited by current user or session.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        identity = get_identity(request)
        is_favorited = FavoriteItem.objects.filter(product_id=product_id, **identity).exists()
        return Response({"product_id": product_id, "is_favorited": is_favorited})
