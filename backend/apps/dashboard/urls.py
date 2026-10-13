from django.urls import path
from .views import (
    DashboardAnalyticsAPIView,
    NotificationCountAPIView,
    LowStockAlertAPIView,
    ExportOrdersCSVAPIView,
    ShopSettingAPIView,
)

app_name = "dashboard"

urlpatterns = [
    path("stats/", DashboardAnalyticsAPIView.as_view(), name="dashboard_stats"),
    path("notifications/count/", NotificationCountAPIView.as_view(), name="notification_count"),
    path("low-stock/", LowStockAlertAPIView.as_view(), name="low_stock_alert"),
    path("export-orders-csv/", ExportOrdersCSVAPIView.as_view(), name="export_orders_csv"),
    path("settings/", ShopSettingAPIView.as_view(), name="shop_settings"),
    path("shop-settings/", ShopSettingAPIView.as_view(), name="shop_settings_alias"),
]


