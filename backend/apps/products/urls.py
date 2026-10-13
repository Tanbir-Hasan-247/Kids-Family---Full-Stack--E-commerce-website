from django.urls import path
from .views import (
    ProductListCreateAPIView,
    ProductDetailAPIView,
    ProductVariantLookupAPIView,
    SaleProductsAPIView,
    AttributeTypeListCreateAPIView,
    AttributeValueListCreateAPIView,
    AttributeValueDeleteAPIView,
    ProductVariantListCreateAPIView,
    ProductVariantDetailAPIView,
    ProductReviewListCreateAPIView,
    FeaturedPhotoReviewsAPIView,
)

app_name = "products"

urlpatterns = [
    path("", ProductListCreateAPIView.as_view(), name="product_list_create"),
    path("photo-reviews/", FeaturedPhotoReviewsAPIView.as_view(), name="photo_reviews"),
    path("<int:pk>/", ProductDetailAPIView.as_view(), name="product_detail"),
    path("<int:product_id>/reviews/", ProductReviewListCreateAPIView.as_view(), name="product_reviews"),
    path("<int:pk>/variant/", ProductVariantLookupAPIView.as_view(), name="variant_lookup"),
    path("sale/", SaleProductsAPIView.as_view(), name="sale_products"),
    path("attributes/types/", AttributeTypeListCreateAPIView.as_view(), name="attribute_types"),
    path("attributes/values/", AttributeValueListCreateAPIView.as_view(), name="attribute_values"),
    path("attributes/values/<int:pk>/", AttributeValueDeleteAPIView.as_view(), name="attribute_value_delete"),
    path("variants/", ProductVariantListCreateAPIView.as_view(), name="variant_list_create"),
    path("variants/<int:pk>/", ProductVariantDetailAPIView.as_view(), name="variant_detail"),
]

