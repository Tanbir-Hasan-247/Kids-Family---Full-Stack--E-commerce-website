from django.urls import path
from .views import (
    CheckoutAPIView,
    OrderListAPIView,
    OrderDetailAPIView,
    OrderPaymentStubAPIView,
    AdminOrderListAPIView,
    AdminOrderDetailUpdateAPIView,
)

app_name = "orders"

urlpatterns = [
    # Customer endpoints
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("", OrderListAPIView.as_view(), name="order_list"),
    path("<str:order_number>/", OrderDetailAPIView.as_view(), name="order_detail"),
    path("<str:order_number>/pay/", OrderPaymentStubAPIView.as_view(), name="order_pay"),

    # Admin endpoints
    path("admin/all/", AdminOrderListAPIView.as_view(), name="admin_order_list"),
    path("admin/<str:order_number>/", AdminOrderDetailUpdateAPIView.as_view(), name="admin_order_update"),
]

