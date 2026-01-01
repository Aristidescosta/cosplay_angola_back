from datetime import timedelta
from pathlib import Path

import environ

# Diretório base
BASE_DIR = Path(__file__).resolve().parent.parent

# Inicializando o django-environ
env = environ.Env(DEBUG=(bool, False))

# Lendo o arquivo .env
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
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

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
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


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": env("DB_ENGINE"),
        "NAME": env("DB_NAME"),
        "USER": env("DB_USER"),
        "PASSWORD": env("DB_PASSWORD"),
        "HOST": env("DB_HOST"),
        "PORT": env("DB_PORT"),
        "CONN_MAX_AGE": 600,
        "OPTIONS": {
            "connect_timeout": 10,
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

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
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    # Define que TODAS as rotas exigem autenticação por padrão
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Por padrão, todas as rotas exigem que o usuário esteja autenticado
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    # Formato de resposta (JSON apenas)
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    # Formato de entrada (JSON apenas)
    "DEFAULT_PARSER_CLASSES": ("rest_framework.parsers.JSONParser",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
}

# ============================================
# SIMPLE JWT CONFIGURATION
# ============================================
SIMPLE_JWT = {
    # Tempo de vida do access token (15 minutos)
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    # Tempo de vida do refresh token (7 dias)
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # Gera um novo refresh token a cada refresh
    # Aumenta segurança
    "ROTATE_REFRESH_TOKENS": True,
    # Adiciona o token antigo à blacklist após refresh
    # Impede reutilização de tokens antigos
    "BLACKLIST_AFTER_ROTATION": True,
    # Atualiza o campo last_login do User automaticamente
    "UPDATE_LAST_LOGIN": True,
    # Algoritmo de criptografia
    "ALGORITHM": "HS256",
    # Chave para assinar os tokens (usa SECRET_KEY do Django)
    "SIGNING_KEY": SECRET_KEY,
    # Chave para verificar tokens (None = usa SIGNING_KEY)
    "VERIFYING_KEY": None,
    # Tipos de tokens aceitos no header Authorization
    "AUTH_HEADER_TYPES": ("Bearer",),
    # Nome do header HTTP
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    # Campo do User usado como identificador no token
    "USER_ID_FIELD": "id",
    # Nome do claim que armazena o ID no token
    "USER_ID_CLAIM": "user_id",
    # Classes de token permitidas
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    # Nome do claim que indica o tipo de token
    "TOKEN_TYPE_CLAIM": "token_type",
}
