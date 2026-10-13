from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from apps.accounts.views import (
    GoogleOAuthRedirectAPIView,
    GoogleOAuthCallbackAPIView,
)



@api_view(["GET"])
@permission_classes([AllowAny])
def api_root_view(request):
    """
    KIDS&FAMILY Backend API Root Directory
    """
    return Response({
        "project": "KIDS&FAMILY E-Commerce REST API",
        "version": "1.0.0",
        "documentation": {
            "swagger_ui": request.build_absolute_uri("/api/docs/"),
            "redoc_ui": request.build_absolute_uri("/api/redoc/"),
            "openapi_schema": request.build_absolute_uri("/api/schema/"),
        },
        "endpoints": {
            "auth": {
                "register": request.build_absolute_uri("/api/auth/register/"),
                "login": request.build_absolute_uri("/api/auth/login/"),
                "token_refresh": request.build_absolute_uri("/api/auth/token/refresh/"),
                "profile": request.build_absolute_uri("/api/auth/profile/"),
                "change_password": request.build_absolute_uri("/api/auth/change-password/"),
                "dashboard_summary": request.build_absolute_uri("/api/auth/dashboard-summary/"),
            },
            "categories": request.build_absolute_uri("/api/categories/"),
            "products": {
                "all_products": request.build_absolute_uri("/api/products/"),
                "sale_products": request.build_absolute_uri("/api/products/sale/"),
                "attributes": request.build_absolute_uri("/api/products/attributes/values/"),
            },
            "cart": {
                "my_cart": request.build_absolute_uri("/api/cart/"),
                "add_to_cart": request.build_absolute_uri("/api/cart/add/"),
                "clear_cart": request.build_absolute_uri("/api/cart/clear/"),
                "merge_cart": request.build_absolute_uri("/api/cart/merge/"),
            },
            "wishlist": {
                "my_wishlist": request.build_absolute_uri("/api/wishlist/"),
            },
            "orders": {
                "checkout": request.build_absolute_uri("/api/orders/checkout/"),
                "my_orders": request.build_absolute_uri("/api/orders/"),
                "admin_all_orders": request.build_absolute_uri("/api/orders/admin/all/"),
            },
            "promotions": {
                "live_banners": request.build_absolute_uri("/api/promotions/banners/live/"),
                "all_banners": request.build_absolute_uri("/api/promotions/banners/"),
            },
            "dashboard": {
                "admin_stats": request.build_absolute_uri("/api/dashboard/stats/"),
                "notification_count": request.build_absolute_uri("/api/dashboard/notifications/count/"),
            },
        },
    })


urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API Root
    path("api/", api_root_view, name="api_root"),

    # API Documentation (Swagger & ReDoc)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Domain Endpoints
    path("api/auth/", include("apps.accounts.urls")),
    path("api/categories/", include("apps.categories.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/promotions/", include("apps.promotions.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),

    # Direct Google OAuth endpoints matching legacy allauth routes
    path("accounts/google/login/", GoogleOAuthRedirectAPIView.as_view(), name="legacy_google_login"),
    path("accounts/google/login/callback/", GoogleOAuthCallbackAPIView.as_view(), name="legacy_google_callback"),
]



if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

