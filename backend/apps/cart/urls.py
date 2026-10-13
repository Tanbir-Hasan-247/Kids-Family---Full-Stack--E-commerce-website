from django.urls import path
from .views import (
    CartDetailAPIView,
    AddToCartAPIView,
    UpdateCartItemAPIView,
    RemoveCartItemAPIView,
    ClearCartAPIView,
    MergeGuestCartAPIView,
)

app_name = "cart"

urlpatterns = [
    path("", CartDetailAPIView.as_view(), name="cart_detail"),
    path("add/", AddToCartAPIView.as_view(), name="add_to_cart"),
    path("items/<int:item_id>/", UpdateCartItemAPIView.as_view(), name="update_item"),
    path("items/<int:item_id>/remove/", RemoveCartItemAPIView.as_view(), name="remove_item"),
    path("clear/", ClearCartAPIView.as_view(), name="clear_cart"),
    path("merge/", MergeGuestCartAPIView.as_view(), name="merge_guest_cart"),
]

