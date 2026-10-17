from django.contrib import admin
from .models import FavoriteItem


@admin.register(FavoriteItem)
class FavoriteItemAdmin(admin.ModelAdmin):
    list_display = ("id", "owner_display", "product", "added_at")
    list_filter = ("added_at",)
    search_fields = ("user__email", "session_key", "product__name")
    readonly_fields = ("added_at",)

    def owner_display(self, obj):
        return obj.user.email if obj.user else f"Guest ({obj.session_key})"

    owner_display.short_description = "User / Session"

