from rest_framework import serializers
from .models import Product, AttributeType, AttributeValue, ProductVariant, ProductReview
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer


class AttributeValueSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source="attribute_type.name", read_only=True)

    class Meta:
        model = AttributeValue
        fields = ["id", "attribute_type", "type_name", "value"]


class AttributeTypeSerializer(serializers.ModelSerializer):
    values = AttributeValueSerializer(source="attributevalue_set", many=True, read_only=True)

    class Meta:
        model = AttributeType
        fields = ["id", "name", "values"]


class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)
    attribute_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=AttributeValue.objects.all(),
        source="attributes",
        required=False,
    )
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "sku",
            "price",
            "compare_at_price",
            "is_on_sale",
            "discount_percent",
            "stock",
            "image",
            "attributes",
            "attribute_ids",
        ]


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product",
            "user",
            "user_email",
            "user_name",
            "rating",
            "comment",
            "image",
            "image_url",
            "created_at",
            "is_approved",
        ]
        read_only_fields = ["id", "product", "user", "created_at", "is_approved"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    parent_category_name = serializers.CharField(source="category.parent.name", read_only=True)
    parent_category_slug = serializers.CharField(source="category.parent.slug", read_only=True)
    starting_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    thumbnail = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    max_discount = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "category",
            "category_name",
            "category_slug",
            "parent_category_name",
            "parent_category_slug",
            "description",
            "base_price",
            "starting_price",
            "thumbnail",
            "is_on_sale",
            "max_discount",
            "average_rating",
            "reviews_count",
            "is_active",
        ]

    def get_thumbnail(self, obj):
        first_variant = obj.variants.first()
        if first_variant and first_variant.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(first_variant.image.url)
            return first_variant.image.url
        return None

    def get_is_on_sale(self, obj):
        return any(v.is_on_sale for v in obj.variants.all())

    def get_max_discount(self, obj):
        discounts = [v.discount_percent for v in obj.variants.all() if v.is_on_sale]
        return max(discounts) if discounts else 0


class ProductDetailSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=False,
        write_only=True,
    )
    variants = ProductVariantSerializer(many=True, read_only=True)
    colors = serializers.SerializerMethodField()
    sizes = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "category",
            "category_id",
            "description",
            "base_price",
            "is_active",
            "variants",
            "colors",
            "sizes",
            "is_favorited",
            "average_rating",
            "reviews_count",
            "reviews",
        ]

    def get_reviews(self, obj):
        approved_reviews = obj.reviews.filter(is_approved=True)[:25]
        return ProductReviewSerializer(approved_reviews, many=True, context=self.context).data


    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.category:
            rep["category"] = CategorySerializer(instance.category).data
        return rep

    def get_colors(self, obj):
        color_values = AttributeValue.objects.filter(
            attribute_type__name__iexact="Color",
            productvariant__product=obj,
        ).distinct()
        return AttributeValueSerializer(color_values, many=True).data

    def get_sizes(self, obj):
        size_values = AttributeValue.objects.filter(
            attribute_type__name__iexact="Size",
            productvariant__product=obj,
        ).distinct()
        return AttributeValueSerializer(size_values, many=True).data

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if not request:
            return False
        from apps.wishlist.models import FavoriteItem
        user = request.user if request.user.is_authenticated else None
        session_key = request.headers.get("X-Session-Key") or request.query_params.get("session_key")
        if user:
            return FavoriteItem.objects.filter(user=user, product=obj).exists()
        elif session_key:
            return FavoriteItem.objects.filter(session_key=session_key, product=obj).exists()
        return False

