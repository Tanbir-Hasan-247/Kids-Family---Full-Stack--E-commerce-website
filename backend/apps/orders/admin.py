from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = (
        "product_name",
        "variant_sku",
        "variant",
        "price",
        "quantity",
        "subtotal_display",
    )
    readonly_fields = (
        "product_name",
        "variant_sku",
        "price",
        "quantity",
        "subtotal_display",
    )
    can_delete = False

    def subtotal_display(self, obj):
        return f"৳{obj.subtotal}"

    subtotal_display.short_description = "Subtotal"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "full_name",
        "phone",
        "city",
        "total_display",
        "payment_method",
        "payment_status_badge",
        "status_badge",
        "created_at",
    )
    list_filter = ("status", "payment_status", "payment_method", "city", "created_at")
    search_fields = (
        "order_number",
        "full_name",
        "phone",
        "email",
        "address_line",
        "city",
    )
    readonly_fields = (
        "order_number",
        "subtotal",
        "shipping_fee",
        "total",
        "created_at",
        "updated_at",
    )
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"
    actions = [
        "mark_as_confirmed",
        "mark_as_processing",
        "mark_as_shipped",
        "mark_as_delivered",
        "mark_as_cancelled",
    ]

    fieldsets = (
        (
            "Customer Information",
            {
                "fields": (
                    "order_number",
                    "user",
                    "session_key",
                    "full_name",
                    "phone",
                    "email",
                )
            },
        ),
        (
            "Shipping Details",
            {"fields": ("address_line", "city", "notes")},
        ),
        (
            "Order & Payment Status",
            {
                "fields": (
                    "status",
                    "cancel_reason",
                    "payment_method",
                    "payment_status",
                )
            },
        ),
        (
            "Financials (BDT)",
            {"fields": ("subtotal", "shipping_fee", "total")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )

    def total_display(self, obj):
        return f"৳{obj.total}"

    total_display.short_description = "Total"

    def status_badge(self, obj):
        colors = {
            "pending": "#f59e0b",
            "confirmed": "#3b82f6",
            "processing": "#6366f1",
            "shipped": "#8b5cf6",
            "delivered": "#10b981",
            "cancelled": "#ef4444",
        }
        color = colors.get(obj.status, "#6b7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def payment_status_badge(self, obj):
        colors = {
            "paid": "#10b981",
            "unpaid": "#f59e0b",
            "failed": "#ef4444",
        }
        color = colors.get(obj.payment_status, "#6b7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 7px; border-radius: 9999px; font-weight: bold; font-size: 11px; text-transform: uppercase;">{}</span>',
            color,
            obj.get_payment_status_display(),
        )

    payment_status_badge.short_description = "Payment"

    @admin.action(description="Mark selected orders as Confirmed")
    def mark_as_confirmed(self, request, queryset):
        queryset.update(status="confirmed")

    @admin.action(description="Mark selected orders as Processing")
    def mark_as_processing(self, request, queryset):
        queryset.update(status="processing")

    @admin.action(description="Mark selected orders as Shipped")
    def mark_as_shipped(self, request, queryset):
        queryset.update(status="shipped")

    @admin.action(description="Mark selected orders as Delivered")
    def mark_as_delivered(self, request, queryset):
        queryset.update(status="delivered")

    @admin.action(description="Mark selected orders as Cancelled")
    def mark_as_cancelled(self, request, queryset):
        queryset.update(status="cancelled")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "product_name",
        "variant_sku",
        "price",
        "quantity",
        "subtotal_display",
    )
    search_fields = ("order__order_number", "product_name", "variant_sku")
    readonly_fields = ("subtotal_display",)

    def subtotal_display(self, obj):
        return f"৳{obj.subtotal}"

    subtotal_display.short_description = "Subtotal"

