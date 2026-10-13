from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import FavoriteItem
from .serializers import FavoriteItemSerializer
from apps.products.models import Product


def get_identity(request):
    """
    Returns query filter dict for either user or session_key.
    """
    if request.user.is_authenticated:
        return {"user": request.user}

    session_key = (
        request.headers.get("X-Session-Key")
        or request.query_params.get("session_key")
        or request.session.session_key
    )
    if not session_key:
        session_key = "anonymous"
    return {"session_key": session_key}


class WishlistListAPIView(APIView):
    """
    List all favorited products for current user or session.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        identity = get_identity(request)
        items = (
            FavoriteItem.objects.filter(**identity)
            .select_related("product__category")
            .prefetch_related("product__variants")
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
            FavoriteItem.objects.create(product=product, **identity)
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

