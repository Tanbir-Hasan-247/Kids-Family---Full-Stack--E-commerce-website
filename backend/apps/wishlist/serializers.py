from rest_framework import serializers
from .models import FavoriteItem
from apps.products.serializers import ProductListSerializer


class FavoriteItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(source="product.id", read_only=True)

    class Meta:
        model = FavoriteItem
        fields = [
            "id",
            "product_id",
            "product",
            "added_at",
        ]

