from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Product,
    ProductVariant,
    AttributeType,
    AttributeValue,
    ProductReview,
)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ("sku", "price", "compare_at_price", "stock", "image")
    show_change_link = True


class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    fields = ("user_name", "rating", "is_approved", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "base_price",
        "is_active",
        "variants_count",
        "avg_rating_display",
    )
    list_filter = ("category", "is_active")
    search_fields = ("name", "description")
    list_editable = ("is_active",)
    inlines = [ProductVariantInline, ProductReviewInline]
    actions = ["make_active", "make_inactive"]

    def variants_count(self, obj):
        return obj.variants.count()

    variants_count.short_description = "Variants"

    def avg_rating_display(self, obj):
        return f"★ {obj.average_rating} ({obj.reviews_count})"

    avg_rating_display.short_description = "Rating"

    @admin.action(description="Mark selected products as active")
    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Mark selected products as inactive")
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        "sku",
        "product",
        "price",
        "compare_at_price",
        "stock",
        "sale_status",
        "thumbnail",
    )
    list_filter = ("product__category", "stock")
    search_fields = ("sku", "product__name")
    filter_horizontal = ("attributes",)
    autocomplete_fields = ["product"]

    def sale_status(self, obj):
        if obj.is_on_sale:
            return format_html(
                '<span style="color: green; font-weight: bold;">ON SALE (-{}%)</span>',
                obj.discount_percent,
            )
        return "-"

    sale_status.short_description = "Sale"

    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return "-"

    thumbnail.short_description = "Image"


class AttributeValueInline(admin.TabularInline):
    model = AttributeValue
    extra = 1


@admin.register(AttributeType)
class AttributeTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "values_display")
    search_fields = ("name",)
    inlines = [AttributeValueInline]

    def values_display(self, obj):
        vals = [v.value for v in obj.attributevalue_set.all()[:8]]
        if not vals:
            return "-"
        text = ", ".join(vals)
        if obj.attributevalue_set.count() > 8:
            text += f" (+{obj.attributevalue_set.count() - 8} more)"
        return text

    values_display.short_description = "Values"


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("value", "attribute_type")
    list_filter = ("attribute_type",)
    search_fields = ("value", "attribute_type__name")


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "user_name",
        "rating_stars",
        "is_approved",
        "created_at",
    )
    list_filter = ("is_approved", "rating", "created_at")
    search_fields = ("user_name", "comment", "product__name")
    list_editable = ("is_approved",)
    actions = ["approve_reviews", "disapprove_reviews"]

    def rating_stars(self, obj):
        return "★" * obj.rating + "☆" * (5 - obj.rating)

    rating_stars.short_description = "Rating"

    @admin.action(description="Approve selected reviews")
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Disapprove selected reviews")
    def disapprove_reviews(self, request, queryset):
        queryset.update(is_approved=False)

