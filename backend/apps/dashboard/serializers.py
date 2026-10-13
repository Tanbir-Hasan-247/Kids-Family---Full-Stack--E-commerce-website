from rest_framework import serializers
from .models import ShopSetting


class ShopSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSetting
        fields = [
            "id",
            "shop_name",
            "tagline",
            "address",
            "phone",
            "email",
            "whatsapp_number",
            "opening_hours",
            "helpline_note",
            "facebook_url",
            "instagram_url",
            "youtube_url",
            "delivery_inside_dhaka",
            "delivery_outside_dhaka",
            "footer_about",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

