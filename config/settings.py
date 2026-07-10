import os
from datetime import timedelta
from pathlib import Path

import cloudinary
import cloudinary.api
import cloudinary.uploader
import dj_database_url
import environ

# =====================
# DIRETÓRIO BASE
# =====================
BASE_DIR = Path(__file__).resolve().parent.parent

# =====================
# DJANGO-ENVIRON
# =====================
env = environ.Env(DEBUG=(bool, False))

# Ler .env (só existe em desenvolvimento local)
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

# =====================
# CONFIGURAÇÕES BÁSICAS
# =====================
SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Se estiver no Render, adicionar domínio do Render
if env.bool("RENDER", default=False):
    ALLOWED_HOSTS.append(".onrender.com")

# =====================
# INSTALLED APPS
# =====================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    "django_extensions",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    # Local apps
    "apps.cosplayers",
    "apps.cosplay_collections",
    "apps.events",
    "apps.media_files",
    "apps.accounts",
]

# =====================
# MIDDLEWARE
# =====================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # ← Whitenoise SEMPRE (produção e dev)
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

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

WSGI_APPLICATION = "config.wsgi.application"

# =====================
# DATABASES
# =====================
# SOLUÇÃO ROBUSTA: Funciona em DEV e PRODUÇÃO
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # PRODUÇÃO: Render fornece DATABASE_URL completa
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # DESENVOLVIMENTO: Lê variáveis individuais do .env
    DATABASES = {
        "default": {
            "ENGINE": env("DB_ENGINE", default="django.db.backends.postgresql"),
            "NAME": env("DB_NAME", default="cosplay_angola_db"),
            "USER": env("DB_USER", default="cosplay_user"),
            "PASSWORD": env("DB_PASSWORD", default=""),
            "HOST": env("DB_HOST", default="localhost"),
            "PORT": env("DB_PORT", default="5432"),
            "CONN_MAX_AGE": 600,
            "OPTIONS": {"connect_timeout": 10},
        }
    }

# =====================
# PASSWORD VALIDATION
# =====================
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# =====================
# INTERNATIONALIZATION
# =====================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# =====================
# STATIC FILES (SEMPRE DEFINIDO)
# =====================
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # ← SEMPRE definido (não dentro de if)

# NÃO usar STATICFILES_DIRS se a pasta não existe
# (comente ou delete esta linha se você não tem uma pasta 'static/')
# STATICFILES_DIRS = [BASE_DIR / "static"]

# Configuração de storage para Whitenoise (produção)
if env.bool("RENDER", default=False):
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# =====================
# DEFAULT PRIMARY KEY
# =====================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# =====================
# REST FRAMEWORK
# =====================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_PARSER_CLASSES": ("rest_framework.parsers.JSONParser",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
}

# =====================
# SIMPLE JWT
# =====================
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
}

# =====================
# SEGURANÇA (PRODUÇÃO)
# =====================
if env.bool("RENDER", default=False):
    # Segurança SSL
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# =====================
# CORS
# =====================
CORS_ALLOW_ALL_ORIGINS = True
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
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# =====================
# CLOUDINARY CONFIGURATION
# =====================

cloudinary.config(
    cloud_name=env("CLOUDINARY_CLOUD_NAME", default=""),
    api_key=env("CLOUDINARY_API_KEY", default=""),
    api_secret=env("CLOUDINARY_API_SECRET", default=""),
    secure=True,  # Sempre usar HTTPS
)

# Configurações de upload
CLOUDINARY_UPLOAD_PRESET = {
    "folder": "cosplay_angola",  # Pasta no Cloudinary
    "allowed_formats": ["jpg", "jpeg", "png", "webp", "gif"],
    "max_file_size": 5 * 1024 * 1024,  # 5MB
    "transformation": [
        {"quality": "auto:best"},  # Otimização automática
        {"fetch_format": "auto"},  # Formato automático (WebP se suportado)
    ],
}
