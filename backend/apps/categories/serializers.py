from rest_framework import serializers
from django.utils.text import slugify
from .models import Category


class CategoryChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class CategorySerializer(serializers.ModelSerializer):
    children = CategoryChildSerializer(many=True, read_only=True)
    product_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    parent_slug = serializers.CharField(source="parent.slug", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "parent_name", "parent_slug", "children", "product_count"]

    def validate(self, attrs):
        if not attrs.get("slug"):
            name = attrs.get("name") or (self.instance.name if self.instance else "")
            base_slug = slugify(name) or "category"
            slug = base_slug
            idx = 1
            qs = Category.objects.filter(slug=slug)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            while qs.exists():
                slug = f"{base_slug}-{idx}"
                qs = Category.objects.filter(slug=slug)
                if self.instance:
                    qs = qs.exclude(id=self.instance.id)
                idx += 1
            attrs["slug"] = slug
        return attrs

    def get_product_count(self, obj):
        if hasattr(obj, "child_prod_count") and hasattr(obj, "direct_prod_count"):
            return obj.child_prod_count + obj.direct_prod_count
        from django.db.models import Q
        from apps.products.models import Product
        return Product.objects.filter(Q(category=obj) | Q(category__parent=obj), is_active=True).count()


