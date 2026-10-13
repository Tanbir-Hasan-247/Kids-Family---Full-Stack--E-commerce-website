from django.urls import path
from .views import WishlistListAPIView, WishlistToggleAPIView, WishlistCheckAPIView

app_name = "wishlist"

urlpatterns = [
    path("", WishlistListAPIView.as_view(), name="wishlist_list"),
    path("toggle/<int:product_id>/", WishlistToggleAPIView.as_view(), name="wishlist_toggle"),
    path("check/<int:product_id>/", WishlistCheckAPIView.as_view(), name="wishlist_check"),
]

