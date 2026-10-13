from rest_framework import serializers
from .models import PromoBanner, HeroSlider


class PromoBannerSerializer(serializers.ModelSerializer):
    is_currently_live = serializers.BooleanField(read_only=True)

    class Meta:
        model = PromoBanner
        fields = [
            "id",
            "title",
            "badge_text",
            "subtitle",
            "image",
            "background_color",
            "cta_text",
            "link_url",
            "is_active",
            "order",
            "start_date",
            "end_date",
            "is_currently_live",
            "created_at",
            "updated_at",
        ]


class HeroSliderSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=False, allow_blank=True, default="Banner")
    link_url = serializers.CharField(required=False, allow_blank=True, default="/products")
    subtitle = serializers.CharField(required=False, allow_blank=True, default="")
    badge_text = serializers.CharField(required=False, allow_blank=True, default="")
    cta_text = serializers.CharField(required=False, allow_blank=True, default="")
    mobile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = HeroSlider
        fields = [
            "id",
            "title",
            "subtitle",
            "badge_text",
            "image",
            "mobile_image",
            "link_url",
            "cta_text",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        if not validated_data.get("title") or validated_data.get("title") == "Banner":
            count = HeroSlider.objects.count() + 1
            validated_data["title"] = f"Banner #{count}"
        return super().create(validated_data)
