from django.contrib import admin
from django.contrib.admin.models import LogEntry
from .models import ShopSetting

admin.site.site_header = "Kids & Family Administration"
admin.site.site_title = "Kids & Family Admin Portal"
admin.site.index_title = "Welcome to Kids & Family Management Dashboard"


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


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ("action_time", "user", "content_type", "object_repr", "action_flag")
    list_filter = ("action_flag", "content_type", "action_time")
    search_fields = ("object_repr", "change_message", "user__email")
    date_hierarchy = "action_time"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
