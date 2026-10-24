from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / ".env")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-kids-family-backend-api-secret-key-production-ready-2026",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

# Production Secret Validation
INSECURE_DEFAULT_SECRET_KEYS = {
    "django-insecure-kids-family-backend-api-secret-key-production-ready-2026",
    "changeme",
    "secret",
}

if not DEBUG:
    if (
        not SECRET_KEY
        or SECRET_KEY in INSECURE_DEFAULT_SECRET_KEYS
        or SECRET_KEY.startswith("django-insecure-")
        or len(SECRET_KEY) < 32
    ):
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured(
            "CRITICAL: A secure, high-entropy DJANGO_SECRET_KEY environment variable (minimum 32 characters) "
            "must be configured when running with DEBUG=False in production."
        )

# Reverse proxy SSL header (Vercel, Render, Cloudflare HTTPS)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Allowed Hosts from environment (e.g. ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com)
allowed_hosts_env = os.environ.get("ALLOWED_HOSTS")
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
else:
    ALLOWED_HOSTS = ["*"]

# CSRF Trusted Origins (e.g. CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com)
csrf_trusted_env = os.environ.get("CSRF_TRUSTED_ORIGINS")
if csrf_trusted_env:
    CSRF_TRUSTED_ORIGINS = [h.strip() for h in csrf_trusted_env.split(",") if h.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://kids-family-backend-one.vercel.app",
    ]
    frontend_url_env = os.environ.get("FRONTEND_URL")
    if frontend_url_env and frontend_url_env not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(frontend_url_env.strip())
    backend_url_env = os.environ.get("BACKEND_URL")
    if backend_url_env and backend_url_env not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(backend_url_env.strip())
    vercel_url_env = os.environ.get("VERCEL_URL")
    if vercel_url_env:
        v_url = f"https://{vercel_url_env.strip()}"
        if v_url not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(v_url)

AUTH_USER_MODEL = "Account.User"

# Application definition
INSTALLED_APPS = [
    # Django Built-in
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party Packages
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    "storages",
    # Custom Domain Apps
    "apps.accounts",
    "apps.categories",
    "apps.products",
    "apps.cart",
    "apps.wishlist",
    "apps.orders",
    "apps.promotions",
    "apps.dashboard",
    "apps.ai_assistant",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
]

try:
    import whitenoise  # noqa: F401
    MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")
except ImportError:
    pass

MIDDLEWARE.extend([
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
])

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"

# Database Configuration
# Supports remote PostgreSQL (e.g. Supabase) via DATABASE_URL or local SQLite fallback
import dj_database_url

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    is_supabase = "supabase" in DATABASE_URL
    is_transaction_pooler = ":6543" in DATABASE_URL
    # Port 6543 (Transaction Pooler): Multiplexes queries so Django can keep TCP/SSL alive (conn_max_age=60)
    # without hogging Postgres server slots, eliminating the ~1.9s cold handshake penalty on every request.
    # Port 5432 (Session Pooler): Strictly limited to pool_size 15, so connections must close immediately (conn_max_age=0).
    if is_transaction_pooler:
        conn_age = 60
    elif is_supabase:
        conn_age = 0
    else:
        conn_age = 600
    db_config = dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=conn_age,
        conn_health_checks=True,
    )
    if db_config.get("ENGINE") == "django.db.backends.postgresql":
        if is_supabase or is_transaction_pooler:
            db_config["DISABLE_SERVER_SIDE_CURSORS"] = True
            db_config.setdefault("OPTIONS", {})
            db_config["OPTIONS"]["prepare_threshold"] = None
        db_config.setdefault("OPTIONS", {})
        db_config["OPTIONS"]["sslmode"] = "require"
        db_config["OPTIONS"]["connect_timeout"] = 30
        db_config["OPTIONS"]["keepalives"] = 1
        db_config["OPTIONS"]["keepalives_idle"] = 30
        db_config["OPTIONS"]["keepalives_interval"] = 10
        db_config["OPTIONS"]["keepalives_count"] = 5

        # Supabase pooler hangs if client_encoding is sent in startup packet
        from django.db.backends.postgresql.base import DatabaseWrapper as PostgresDatabaseWrapper
        if not hasattr(PostgresDatabaseWrapper, "_supabase_patched"):
            _orig_get_connection_params = PostgresDatabaseWrapper.get_connection_params

            def _supabase_safe_get_connection_params(self):
                params = _orig_get_connection_params(self)
                params.pop("client_encoding", None)
                return params

            PostgresDatabaseWrapper.get_connection_params = _supabase_safe_get_connection_params
            PostgresDatabaseWrapper._supabase_patched = True
    DATABASES = {"default": db_config}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

# Static & Media Files
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_ROOT = BASE_DIR / "media"

# Cloudflare R2 Object Storage Configuration
USE_CLOUDFLARE_R2 = bool(
    os.environ.get("CLOUDFLARE_R2_ACCESS_KEY_ID")
    and os.environ.get("CLOUDFLARE_R2_BUCKET_NAME")
)

if USE_CLOUDFLARE_R2:
    AWS_ACCESS_KEY_ID = os.environ.get("CLOUDFLARE_R2_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.environ.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = os.environ.get("CLOUDFLARE_R2_BUCKET_NAME")
    AWS_S3_ENDPOINT_URL = os.environ.get("CLOUDFLARE_R2_ENDPOINT_URL")
    AWS_S3_REGION_NAME = "auto"
    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_DEFAULT_ACL = None
    AWS_S3_FILE_OVERWRITE = False

    r2_public_domain = os.environ.get("CLOUDFLARE_R2_PUBLIC_URL", "").strip()
    if r2_public_domain:
        clean_domain = r2_public_domain.replace("https://", "").replace("http://", "").rstrip("/")
        AWS_S3_CUSTOM_DOMAIN = clean_domain
        AWS_QUERYSTRING_AUTH = False
        MEDIA_URL = f"https://{clean_domain}/"
    else:
        AWS_QUERYSTRING_AUTH = True
        AWS_QUERYSTRING_EXPIRE = 604800  # 7 days for signed URLs
        MEDIA_URL = f"{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/"

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    MEDIA_URL = "/media/"
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Strict CORS Configuration
cors_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS")
if cors_origins_env:
    CORS_ALLOWED_ORIGINS = [h.strip() for h in cors_origins_env.split(",") if h.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://kids-family.vercel.app",
        "https://kids-family-backend-one.vercel.app",
    ]
    frontend_url_env = os.environ.get("FRONTEND_URL")
    if frontend_url_env and frontend_url_env not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(frontend_url_env.strip())
    vercel_url_env = os.environ.get("VERCEL_URL")
    if vercel_url_env:
        v_url = f"https://{vercel_url_env.strip()}"
        if v_url not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(v_url)

# Always disable wildcard when credentials (cookies/tokens) are supported
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-session-key",
]

# Password Hashers (Argon2 / PBKDF2)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

# Django REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "120/minute",
        "user": "300/minute",
        "auth": "10/minute",         # Brute-force protection on Login/Register
        "ai_chat": "30/minute",      # Gemini AI billing & DoS protection
        "track_order": "30/minute",  # Scraping protection on tracking endpoints
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 48,
}

# Simple JWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# Sensitive Logging Configuration & Redaction
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
            "style": "{",
        },
        "pii_safe": {
            "()": "apps.common.logging_formatter.PIISafeFormatter",
            "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "pii_safe",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# DRF Spectacular (Swagger & Redoc Documentation)
SPECTACULAR_SETTINGS = {
    "TITLE": "KIDS&FAMILY E-Commerce REST API",
    "DESCRIPTION": (
        "Comprehensive backend REST API for KIDS&FAMILY E-Commerce application. "
        "Provides endpoints for Authentication, Categories, Products & Variants, "
        "Cart, Wishlist, Order Processing, Promotions & Banners, and Admin Analytics."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# Google OAuth & Frontend Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "")

# Google Gemini AI Configuration (Free tier: 15 RPM, 1500 RPD)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
