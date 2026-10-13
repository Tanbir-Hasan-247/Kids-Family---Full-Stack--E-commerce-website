from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.serializers import ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    variant = ProductVariantSerializer(read_only=True)
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    product_id = serializers.IntegerField(source="variant.product.id", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "variant",
            "product_id",
            "product_name",
            "quantity",
            "subtotal",
            "added_at",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = [
            "id",
            "session_key",
            "total_items",
            "total_price",
            "items",
            "created_at",
            "updated_at",
        ]


class AddToCartSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)


class UpdateCartItemSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["increase", "decrease", "set"], required=False)
    quantity = serializers.IntegerField(required=False, min_value=1)

