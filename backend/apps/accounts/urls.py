from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterAPIView,
    LoginAPIView,
    ProfileAPIView,
    ChangePasswordAPIView,
    UserDashboardSummaryAPIView,
    GoogleAuthAPIView,
    GoogleOAuthRedirectAPIView,
    GoogleOAuthCallbackAPIView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("change-password/", ChangePasswordAPIView.as_view(), name="change_password"),
    path("dashboard-summary/", UserDashboardSummaryAPIView.as_view(), name="dashboard_summary"),
    path("google/", GoogleAuthAPIView.as_view(), name="google_auth"),
    path("google/login/", GoogleOAuthRedirectAPIView.as_view(), name="google_login"),
    path("google/callback/", GoogleOAuthCallbackAPIView.as_view(), name="google_callback"),
]


