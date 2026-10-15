from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    image = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "variant",
            "product_id",
            "product_name",
            "variant_sku",
            "price",
            "quantity",
            "subtotal",
            "image",
            "attributes",
        ]

    def get_image(self, obj):
        if obj.variant and obj.variant.image:
            return obj.variant.image.url
        return None

    def get_attributes(self, obj):
        if obj.variant:
            return [
                {
                    "id": attr.id,
                    "type_name": attr.attribute_type.name,
                    "value": attr.value,
                }
                for attr in obj.variant.attributes.all()
            ]
        return []

    def get_product_id(self, obj):
        if obj.variant and obj.variant.product:
            return obj.variant.product.id
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user",
            "session_key",
            "full_name",
            "phone",
            "email",
            "address_line",
            "city",
            "notes",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "status",
            "status_display",
            "cancel_reason",
            "subtotal",
            "shipping_fee",
            "total",
            "items",
            "created_at",
            "updated_at",
        ]


class CheckoutSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    address_line = serializers.CharField()
    city = serializers.CharField(max_length=100)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default="cod")
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=60)


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status", "payment_status", "cancel_reason"]

