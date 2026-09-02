"""
Django settings for MoneyMaker Aviator.
"""
 
import os
from datetime import timedelta
from pathlib import Path
 
import dj_database_url
from dotenv import load_dotenv
 
load_dotenv()
 
BASE_DIR = Path(__file__).resolve().parent.parent
 
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-insecure-secret-key-change-me")
DEBUG = os.environ.get("DEBUG", "True") == "True"
 
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
 
# ------------------------------------------------------------------
# Applications
# ------------------------------------------------------------------
INSTALLED_APPS = [
    "daphne",  # must be first — makes `runserver` ASGI-capable automatically

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "channels",

    "api",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
 
ROOT_URLCONF = "backend.urls"
 
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
 
WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"

# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "moneymaker"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

AUTHENTICATION_BACKENDS = [
    "api.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",  # keep for admin/username fallback
]

AUTH_USER_MODEL = "api.User"
 
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    # {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    # {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
 
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True
 
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
 
# ------------------------------------------------------------------
# Redis / Channels
# ------------------------------------------------------------------
USE_REDIS = os.environ.get("USE_REDIS", "False") == "True"
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

if USE_REDIS:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        },
    }
else:
    # Dev-only: works within a single process, no external service required.
    CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
    }
 
# ------------------------------------------------------------------
# DRF / JWT
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "300/minute",
        "anon": "30/minute",
        "bet": "60/minute",
        "cashout": "120/minute",
        "admin_login": "10/hour",
        "admin_otp": "20/hour",
    },
    "EXCEPTION_HANDLER": "api.exceptions.custom_exception_handler",
}
 
JWT_SECRET = os.environ.get("JWT_SECRET") or SECRET_KEY
 
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "SIGNING_KEY": JWT_SECRET,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
 
# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True
 
# ------------------------------------------------------------------
# Celery
# ------------------------------------------------------------------
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
 
# ------------------------------------------------------------------
# Game engine tuning (safe defaults — see api/game_engine.py)
# ------------------------------------------------------------------
AVIATOR_BETTING_DURATION_SECONDS = float(os.environ.get("AVIATOR_BETTING_DURATION_SECONDS", "5"))
AVIATOR_WAITING_DURATION_SECONDS = float(os.environ.get("AVIATOR_WAITING_DURATION_SECONDS", "3"))
AVIATOR_GROWTH_RATE = os.environ.get("AVIATOR_GROWTH_RATE", "0.08")
AVIATOR_HOUSE_EDGE_PERCENT = os.environ.get("AVIATOR_HOUSE_EDGE_PERCENT", "3.00")
AVIATOR_MIN_BET = os.environ.get("AVIATOR_MIN_BET", "10.00")
AVIATOR_MAX_BET = os.environ.get("AVIATOR_MAX_BET", "50000.00")
 
# ------------------------------------------------------------------
# M-Pesa Daraja API Configuration
# ------------------------------------------------------------------
MPESA_ENV = os.environ.get("MPESA_ENV", "sandbox")  # "sandbox" or "production"
MPESA_CONSUMER_KEY = os.environ.get("MPESA_CONSUMER_KEY", "")
MPESA_CONSUMER_SECRET = os.environ.get("MPESA_CONSUMER_SECRET", "")
MPESA_SHORTCODE = os.environ.get("MPESA_SHORTCODE", "174379")  # Sandbox default
MPESA_PASSKEY = os.environ.get("MPESA_PASSKEY", "")
MPESA_CALLBACK_URL = os.environ.get("MPESA_CALLBACK_URL", "https://your-domain.com/api/mpesa/callback/")
 
# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "aviator.engine": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "aviator.wallet": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "aviator.mpesa": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "aviator.views": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}


EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "..."
EMAIL_HOST_PASSWORD = "..."