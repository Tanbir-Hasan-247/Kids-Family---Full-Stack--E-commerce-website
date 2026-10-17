from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ("variant", "quantity", "subtotal_display", "added_at")
    readonly_fields = ("subtotal_display", "added_at")

    def subtotal_display(self, obj):
        return f"৳{obj.subtotal}"

    subtotal_display.short_description = "Subtotal"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "owner_display",
        "total_items_display",
        "total_price_display",
        "created_at",
        "updated_at",
    )
    search_fields = ("user__email", "session_key")
    readonly_fields = (
        "created_at",
        "updated_at",
        "total_items_display",
        "total_price_display",
    )
    inlines = [CartItemInline]

    def owner_display(self, obj):
        return obj.user.email if obj.user else f"Guest ({obj.session_key})"

    owner_display.short_description = "Owner"

    def total_items_display(self, obj):
        return obj.total_items

    total_items_display.short_description = "Items"

    def total_price_display(self, obj):
        return f"৳{obj.total_price}"

    total_price_display.short_description = "Total"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "variant", "quantity", "subtotal_display", "added_at")
    search_fields = (
        "cart__user__email",
        "cart__session_key",
        "variant__sku",
        "variant__product__name",
    )
    readonly_fields = ("added_at", "subtotal_display")

    def subtotal_display(self, obj):
        return f"৳{obj.subtotal}"

    subtotal_display.short_description = "Subtotal"

