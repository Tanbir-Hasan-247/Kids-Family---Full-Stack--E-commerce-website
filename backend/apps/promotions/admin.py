from django.contrib import admin
from django.utils.html import format_html
from .models import PromoBanner, HeroSlider


@admin.register(PromoBanner)
class PromoBannerAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "badge_text",
        "background_color",
        "order",
        "is_active",
        "live_status",
        "thumbnail",
        "created_at",
    )
    list_filter = ("is_active", "background_color")
    search_fields = ("title", "subtitle", "badge_text", "link_url")
    list_editable = ("order", "is_active")

    def live_status(self, obj):
        if obj.is_currently_live:
            return format_html(
                '<span style="background-color: #10b981; color: white; padding: 2px 7px; border-radius: 9999px; font-weight: bold; font-size: 11px;">LIVE</span>'
            )
        return format_html(
            '<span style="background-color: #6b7280; color: white; padding: 2px 7px; border-radius: 9999px; font-weight: bold; font-size: 11px;">INACTIVE</span>'
        )

    live_status.short_description = "Status"

    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return "-"

    thumbnail.short_description = "Banner Image"


@admin.register(HeroSlider)
class HeroSliderAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "badge_text",
        "cta_text",
        "order",
        "is_active",
        "desktop_preview",
        "mobile_preview",
        "created_at",
    )
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle", "badge_text", "link_url")
    list_editable = ("order", "is_active")

    def desktop_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 70px; height: 35px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return "-"

    desktop_preview.short_description = "Desktop Image"

    def mobile_preview(self, obj):
        if obj.mobile_image:
            return format_html(
                '<img src="{}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 4px;" />',
                obj.mobile_image.url,
            )
        return "-"

    mobile_preview.short_description = "Mobile Image"

