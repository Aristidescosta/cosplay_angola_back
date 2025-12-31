from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views import LogoutView, RegisterView, UserDetailView

urlpatterns = [
    # Registro de novo usuário
    path("register/", RegisterView.as_view(), name="register"),
    # Obter tokens (login)
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    # Refresh de access token
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Verificar se token é válido
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # Dados do usuário autenticado
    path("user/", UserDetailView.as_view(), name="user_detail"),
    # Logout (blacklist do refresh token)
    path("logout/", LogoutView.as_view(), name="logout"),
]
