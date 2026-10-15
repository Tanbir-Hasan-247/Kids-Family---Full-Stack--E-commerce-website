import urllib.parse
import requests
from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    ChangePasswordSerializer,
)


class RegisterAPIView(generics.CreateAPIView):
    """
    Register a new customer account.
    Returns user profile without auto-authenticating, so user must log in.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "User registered successfully.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    """
    Log in using email and password.
    Returns JWT access & refresh tokens along with user information.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        user = validated_data["user"]
        return Response(
            {
                "message": "Login successful.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": validated_data["access"],
                    "refresh": validated_data["refresh"],
                },
            },
            status=status.HTTP_200_OK,
        )


class ProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    Get or update the current authenticated user's profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordAPIView(APIView):
    """
    Change user password. Requires old_password and new_password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


class UserDashboardSummaryAPIView(APIView):
    """
    User dashboard metrics:
    - total_orders
    - pending_orders
    - wishlist_count
    - recent_orders (latest 4 orders)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from apps.orders.models import Order
        from apps.wishlist.models import FavoriteItem
        from apps.orders.serializers import OrderSerializer

        total_orders = Order.objects.filter(user=user).count()
        pending_orders = Order.objects.filter(
            user=user,
            status__in=["pending", "confirmed", "processing"],
        ).count()
        wishlist_count = FavoriteItem.objects.filter(user=user).count()
        recent_orders_qs = (
            Order.objects.filter(user=user)
            .prefetch_related(
                "items__variant__product",
                "items__variant__attributes__attribute_type",
            )
            .order_by("-created_at")[:4]
        )

        return Response(
            {
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "wishlist_count": wishlist_count,
                "recent_orders": OrderSerializer(recent_orders_qs, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class GoogleOAuthRedirectAPIView(APIView):
    """
    Initiates Google OAuth2 web authorization flow.
    Redirects user to Google OAuth consent screen using the standard django-allauth
    callback URI (/accounts/google/login/callback/).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
        configured_uri = getattr(settings, "GOOGLE_REDIRECT_URI", "")
        query_uri = request.GET.get("redirect_uri")

        if query_uri:
            redirect_uri = query_uri
        elif configured_uri:
            redirect_uri = configured_uri
        else:
            host = request.get_host()
            scheme = "https" if request.is_secure() else "http"
            redirect_uri = f"{scheme}://{host}/accounts/google/login/callback/"

        # Send redirect_uri inside state so the callback knows the exact URI used
        state = urllib.parse.quote(redirect_uri)

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "prompt": "select_account",
            "state": state,
        }
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
        return HttpResponseRedirect(auth_url)


class GoogleOAuthCallbackAPIView(APIView):
    """
    Handles Google OAuth2 callback.
    Exchanges code for tokens, verifies profile, gets/creates user,
    and redirects to React frontend with SimpleJWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        code = request.GET.get("code")
        error = request.GET.get("error")
        state = request.GET.get("state")
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

        if error or not code:
            err_msg = error or "google_auth_cancelled"
            return HttpResponseRedirect(f"{frontend_url}/login?error={urllib.parse.quote(err_msg)}")

        client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
        client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "")

        # Use the exact redirect_uri sent during the authorize step
        if state:
            redirect_uri = urllib.parse.unquote(state)
        else:
            configured_uri = getattr(settings, "GOOGLE_REDIRECT_URI", "")
            if configured_uri:
                redirect_uri = configured_uri
            else:
                host = request.get_host()
                scheme = "https" if request.is_secure() else "http"
                redirect_uri = f"{scheme}://{host}/accounts/google/login/callback/"

        try:
            token_response = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={"Accept": "application/json"},
                timeout=10,
            )
            token_json = token_response.json()
            google_access_token = token_json.get("access_token")

            if not google_access_token:
                err_desc = token_json.get("error_description", "token_exchange_failed")
                return HttpResponseRedirect(f"{frontend_url}/login?error={urllib.parse.quote(err_desc)}")

            userinfo_res = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {google_access_token}"},
                timeout=10,
            )
            userinfo = userinfo_res.json()
            email = userinfo.get("email")

            if not email:
                return HttpResponseRedirect(f"{frontend_url}/login?error=email_not_provided")

            first_name = userinfo.get("given_name", "")
            last_name = userinfo.get("family_name", "")

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_active": True,
                },
            )

            if not created and not user.is_active:
                return HttpResponseRedirect(f"{frontend_url}/login?error=account_disabled")

            if not user.first_name and first_name:
                user.first_name = first_name
                user.last_name = last_name
                user.save(update_fields=["first_name", "last_name"])

            refresh = RefreshToken.for_user(user)
            access_jwt = str(refresh.access_token)
            refresh_jwt = str(refresh)

            redirect_target = f"{frontend_url}/login?google_success=1&access={access_jwt}&refresh={refresh_jwt}"
            return HttpResponseRedirect(redirect_target)

        except Exception as e:
            return HttpResponseRedirect(f"{frontend_url}/login?error={urllib.parse.quote(str(e))}")


class GoogleAuthAPIView(APIView):
    """
    Direct REST API endpoint to authenticate with Google ID token or access token from frontend client.
    Accepts: { "credential": "<id_token>" } or { "access_token": "<token>" }
    Returns: JWT access & refresh tokens along with user information.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        access_token = request.data.get("access_token")

        if not credential and not access_token:
            return Response(
                {"error": "Either credential or access_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = None
        first_name = ""
        last_name = ""

        try:
            if credential:
                res = requests.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                    timeout=10,
                )
                if res.status_code != 200:
                    return Response(
                        {"error": "Invalid Google credential."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                info = res.json()
                email = info.get("email")
                first_name = info.get("given_name", "")
                last_name = info.get("family_name", "")
            elif access_token:
                res = requests.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10,
                )
                if res.status_code != 200:
                    return Response(
                        {"error": "Invalid Google access token."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                info = res.json()
                email = info.get("email")
                first_name = info.get("given_name", "")
                last_name = info.get("family_name", "")

            if not email:
                return Response(
                    {"error": "Could not retrieve email from Google."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_active": True,
                },
            )

            if not user.is_active:
                return Response(
                    {"error": "User account is disabled."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not user.first_name and first_name:
                user.first_name = first_name
                user.last_name = last_name
                user.save(update_fields=["first_name", "last_name"])

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Google authentication successful.",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to authenticate with Google: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


