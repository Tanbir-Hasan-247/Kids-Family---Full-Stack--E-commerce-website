from django.contrib import admin
from .models import ShopSetting


@admin.register(ShopSetting)
class ShopSettingAdmin(admin.ModelAdmin):
    list_display = ("shop_name", "phone", "email", "address", "updated_at")
    fieldsets = (
        ("Shop Identity", {
            "fields": ("shop_name", "tagline", "footer_about")
        }),
        ("Contact Information", {
            "fields": ("phone", "email", "whatsapp_number", "address", "opening_hours", "helpline_note")
        }),
        ("Social Links", {
            "fields": ("facebook_url", "instagram_url", "youtube_url")
        }),
        ("Delivery Fees (BDT)", {
            "fields": ("delivery_inside_dhaka", "delivery_outside_dhaka")
        }),
    )

    def has_add_permission(self, request):
        # Singleton: allow add only if none exists
        return not ShopSetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

