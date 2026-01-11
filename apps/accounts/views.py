from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer


@api_view(["GET"])
def api_root(request, format=None):
    """
    API Root - Lista todos os endpoints disponíveis.

    Esta view retorna uma página inicial amigável com todos os endpoints
    da API, substituindo o erro 404 padrão.
    """
    return Response(
        {
            "message": "Bem-vindo à API do Cosplay Angola! 🎭",
            "version": "1.0.0",
            "documentation": ("https://github.com/seu-usuario/cosplay-angola-backend"),
            "endpoints": {
                "authentication": {
                    "register": reverse("register", request=request, format=format),
                    "login": reverse(
                        "token_obtain_pair", request=request, format=format
                    ),
                    "token_refresh": reverse(
                        "token_refresh", request=request, format=format
                    ),
                    "token_verify": reverse(
                        "token_verify", request=request, format=format
                    ),
                    "user_profile": reverse(
                        "user_detail", request=request, format=format
                    ),
                    "logout": reverse("logout", request=request, format=format),
                },
                "events": {
                    "list_all": reverse("evento-list", request=request, format=format),
                    "upcoming": request.build_absolute_uri("/api/events/proximos/"),
                    "past": request.build_absolute_uri("/api/events/passados/"),
                    "highlights": request.build_absolute_uri("/api/events/destaques/"),
                },
                "media": {
                    "list_all": reverse("midia-list", request=request, format=format),
                    "upload": request.build_absolute_uri("/api/media/upload/"),
                },
            },
            "usage": {
                "authentication": (
                    "Inclua o token JWT no header: " "Authorization: Bearer <token>"
                ),
                "pagination": ("Use ?page=N e ?page_size=N para controlar paginação"),
                "filtering": (
                    "Eventos suportam filtros por categoria, " "tipo, status, data"
                ),
                "search": (
                    "Use ?search=termo para buscar em título, " "descrição e local"
                ),
            },
            "examples": {
                "register": (
                    "POST /api/auth/register/ com username, "
                    "email, password, password2"
                ),
                "login": "POST /api/auth/token/ com username e password",
                "list_events": "GET /api/events/",
                "filter_events": (
                    "GET /api/events/?tipo_evento=concurso" "&status=publicado"
                ),
                "search_events": "GET /api/events/?search=luanda",
                "upcoming_events": "GET /api/events/proximos/?limit=5",
                "upload_image": (
                    "POST /api/media/upload/ " '(multipart/form-data com campo "image")'
                ),
            },
        }
    )


class RegisterView(generics.CreateAPIView):
    """
    View para registro de novos usuários.

    Endpoint: POST /api/auth/register/
    Permission: Qualquer pessoa (AllowAny)

    Body esperado:
    {
        "username": "novo_usuario",
        "email": "usuario@example.com",
        "password": "senha_forte_123",
        "password2": "senha_forte_123",
        "first_name": "Nome",      # opcional
        "last_name": "Sobrenome"   # opcional
    }

    Resposta 201:
    {
        "user": {
            "id": 1,
            "username": "novo_usuario",
            "email": "usuario@example.com",
            ...
        },
        "message": "Usuário registrado com sucesso! Faça login para obter tokens."
    }
    """

    queryset = User.objects.all()
    permission_classes = (AllowAny,)  # Permite acesso sem autenticação
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        """Sobrescreve create para retornar mensagem customizada."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "user": UserSerializer(user).data,
                "message": "Usuário registrado com sucesso! Faça login"
                "para obter tokens.",
            },
            status=status.HTTP_201_CREATED,
        )


class UserDetailView(APIView):
    """
    View para obter informações do usuário autenticado.

    Endpoint: GET /api/auth/user/
    Permission: Somente usuários autenticados
    Header: Authorization: Bearer <access_token>

    Resposta 200:
    {
        "id": 1,
        "username": "usuario",
        "email": "usuario@example.com",
        "first_name": "Nome",
        "last_name": "Sobrenome",
        "is_superuser": false,
        "is_staff": false
    }
    """

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Retorna dados do usuário autenticado."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """
    View para logout (adiciona refresh token à blacklist).

    Endpoint: POST /api/auth/logout/
    Permission: Somente usuários autenticados

    Body esperado:
    {
        "refresh": "refresh_token_aqui"
    }

    Resposta 205:
    {
        "message": "Logout realizado com sucesso."
    }

    Por que 205 RESET CONTENT?
    É o código HTTP semântico para "operação bem-sucedida,
    cliente deve resetar a view". No caso de logout, o frontend
    deve limpar o estado de autenticação.
    """

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()  # Adiciona à blacklist

            return Response(
                {"message": "Logout realizado com sucesso."},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception:
            return Response(
                {"error": "Token inválido ou já utilizado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
