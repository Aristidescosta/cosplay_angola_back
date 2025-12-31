import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

# ============================================
# FIXTURES (Dados reutilizáveis nos testes)
# ============================================


@pytest.fixture
def api_client():
    """
    Fixture que retorna um cliente API do DRF.

    O que é um fixture?
    - É uma função que prepara dados para os testes
    - Pode ser reutilizada em vários testes
    - Roda antes de cada teste que a usar

    Por que usar?
    - Evita repetir código
    - Deixa os testes mais limpos
    """
    return APIClient()


@pytest.fixture
def user_data():
    """
    Fixture com dados de usuário válidos para testes.
    """
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
        "password2": "TestPass123!",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def create_user(user_data):
    """
    Fixture que cria um usuário no banco.

    Útil para testes de login (precisa de um usuário existente).
    """
    return User.objects.create_user(
        username=user_data["username"],
        email=user_data["email"],
        password=user_data["password"],
        first_name=user_data.get("first_name", ""),
        last_name=user_data.get("last_name", ""),
    )


@pytest.fixture
def superuser_data():
    """
    Fixture com dados de superusuário para testes.
    """
    return {
        "username": "admin",
        "email": "admin@example.com",
        "password": "AdminPass123!",
    }


@pytest.fixture
def create_superuser(superuser_data):
    """
    Fixture que cria um superusuário no banco.
    """
    return User.objects.create_superuser(
        username=superuser_data["username"],
        email=superuser_data["email"],
        password=superuser_data["password"],
    )


# ============================================
# TESTES DE REGISTRO
# ============================================


@pytest.mark.django_db
class TestRegisterView:
    """
    Testes para o endpoint de registro de usuários.

    O que @pytest.mark.django_db faz?
    - Dá permissão para o teste acessar o banco de dados
    - Cria um banco temporário para os testes
    - Limpa o banco após cada teste
    """

    def test_register_success(self, api_client, user_data):
        """
        Teste: Registro bem-sucedido com dados válidos.

        Fluxo:
        1. Envia dados válidos para /api/auth/register/
        2. Verifica se retorna 201 CREATED
        3. Verifica se retorna dados do usuário
        4. Verifica se o usuário foi criado no banco
        """
        url = reverse("register")  # Pega a URL pelo nome
        response = api_client.post(url, user_data, format="json")

        # Verifica status code
        assert response.status_code == status.HTTP_201_CREATED

        # Verifica se retorna dados do usuário
        assert "user" in response.data
        assert response.data["user"]["username"] == user_data["username"]
        assert response.data["user"]["email"] == user_data["email"]

        # Verifica se contém mensagem de sucesso
        assert "message" in response.data

        # Verifica se o usuário foi criado no banco
        assert User.objects.filter(username=user_data["username"]).exists()

    def test_register_password_mismatch(self, api_client, user_data):
        """
        Teste: Registro falha quando senhas não coincidem.

        Por que testar isso?
        - Garante que a validação de senha está funcionando
        - Evita que usuários criem contas com senhas erradas
        """
        user_data["password2"] = "DifferentPass123!"

        url = reverse("register")
        response = api_client.post(url, user_data, format="json")

        # Deve retornar 400 BAD REQUEST
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Deve conter erro no campo password
        assert "password" in response.data

    def test_register_duplicate_username(self, api_client, user_data, create_user):
        """
        Teste: Registro falha com username duplicado.

        Fluxo:
        1. Cria um usuário (via fixture create_user)
        2. Tenta criar outro com mesmo username
        3. Deve falhar com 400
        """
        url = reverse("register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "username" in response.data

    def test_register_duplicate_email(self, api_client, user_data, create_user):
        """
        Teste: Registro falha com email duplicado.
        """
        # Muda o username mas mantém o email duplicado
        user_data["username"] = "different_user"

        url = reverse("register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_register_weak_password(self, api_client, user_data):
        """
        Teste: Registro falha com senha fraca.

        Por que testar isso?
        - Garante que o validate_password do Django está funcionando
        - Senhas fracas são vulnerabilidade de segurança
        """
        user_data["password"] = "123"  # Senha muito curta
        user_data["password2"] = "123"

        url = reverse("register")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data

    def test_register_missing_fields(self, api_client):
        """
        Teste: Registro falha quando faltam campos obrigatórios.
        """
        incomplete_data = {"username": "testuser"}

        url = reverse("register")
        response = api_client.post(url, incomplete_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================
# TESTES DE LOGIN (OBTENÇÃO DE TOKENS)
# ============================================


@pytest.mark.django_db
class TestLoginView:
    """
    Testes para o endpoint de login (obtenção de tokens JWT).
    """

    def test_login_success(self, api_client, user_data, create_user):
        """
        Teste: Login bem-sucedido retorna tokens.

        Fluxo:
        1. Cria um usuário (via fixture)
        2. Faz login com credenciais corretas
        3. Verifica se retorna access e refresh tokens
        """
        url = reverse("token_obtain_pair")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"],
        }
        response = api_client.post(url, login_data, format="json")

        # Verifica status code
        assert response.status_code == status.HTTP_200_OK

        # Verifica se retorna ambos os tokens
        assert "access" in response.data
        assert "refresh" in response.data

        # Verifica se os tokens não estão vazios
        assert len(response.data["access"]) > 0
        assert len(response.data["refresh"]) > 0

    def test_login_wrong_password(self, api_client, user_data, create_user):
        """
        Teste: Login falha com senha incorreta.

        Por que testar isso?
        - Garante segurança: usuários não autorizados não entram
        - Verifica se a validação de senha está funcionando
        """
        url = reverse("token_obtain_pair")
        login_data = {
            "username": user_data["username"],
            "password": "WrongPassword123!",
        }
        response = api_client.post(url, login_data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """
        Teste: Login falha com usuário inexistente.
        """
        url = reverse("token_obtain_pair")
        login_data = {"username": "nonexistent", "password": "Pass123!"}
        response = api_client.post(url, login_data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_credentials(self, api_client):
        """
        Teste: Login falha quando faltam credenciais.
        """
        url = reverse("token_obtain_pair")

        # Falta password
        response = api_client.post(url, {"username": "test"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================
# TESTES DE REFRESH TOKEN
# ============================================


@pytest.mark.django_db
class TestTokenRefresh:
    """
    Testes para o endpoint de refresh de tokens.
    """

    def test_refresh_success(self, api_client, user_data, create_user):
        """
        Teste: Refresh token válido retorna novo access token.

        Fluxo:
        1. Faz login para obter tokens
        2. Usa refresh token para pegar novo access token
        3. Verifica se retorna novo access token
        """
        # 1. Fazer login
        login_url = reverse("token_obtain_pair")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"],
        }
        login_response = api_client.post(login_url, login_data, format="json")
        refresh_token = login_response.data["refresh"]

        # 2. Usar refresh token
        refresh_url = reverse("token_refresh")
        refresh_data = {"refresh": refresh_token}
        refresh_response = api_client.post(refresh_url, refresh_data, format="json")

        # 3. Verificar resposta
        assert refresh_response.status_code == status.HTTP_200_OK
        assert "access" in refresh_response.data

        # Como ROTATE_REFRESH_TOKENS=True, também retorna novo refresh
        assert "refresh" in refresh_response.data

    def test_refresh_invalid_token(self, api_client):
        """
        Teste: Refresh falha com token inválido.
        """
        url = reverse("token_refresh")
        data = {"refresh": "invalid_token_here"}
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# TESTES DE ROTAS PROTEGIDAS
# ============================================


@pytest.mark.django_db
class TestProtectedRoutes:
    """
    Testes para verificar se rotas protegidas funcionam corretamente.
    """

    def test_user_detail_authenticated(self, api_client, user_data, create_user):
        """
        Teste: Usuário autenticado consegue acessar /api/auth/user/.

        Fluxo:
        1. Faz login para obter token
        2. Usa token para acessar rota protegida
        3. Verifica se retorna dados do usuário
        """
        # 1. Fazer login
        login_url = reverse("token_obtain_pair")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"],
        }
        login_response = api_client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]

        # 2. Acessar rota protegida com token
        user_url = reverse("user_detail")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = api_client.get(user_url)

        # 3. Verificar resposta
        assert response.status_code == status.HTTP_200_OK
        assert "username" in response.data
        assert response.data["username"] == user_data["username"]

    def test_user_detail_unauthenticated(self, api_client):
        """
        Teste: Usuário não autenticado NÃO consegue acessar rota protegida.

        Por que testar isso?
        - Garante segurança: rotas protegidas só são acessíveis com token
        - Verifica se o middleware de autenticação está funcionando
        """
        url = reverse("user_detail")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_detail_invalid_token(self, api_client):
        """
        Teste: Token inválido não dá acesso à rota protegida.
        """
        url = reverse("user_detail")
        api_client.credentials(HTTP_AUTHORIZATION="Bearer invalid_token")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# TESTES DE LOGOUT
# ============================================


@pytest.mark.django_db
class TestLogoutView:
    """
    Testes para o endpoint de logout (blacklist de tokens).
    """

    def test_logout_success(self, api_client, user_data, create_user):
        """
        Teste: Logout bem-sucedido adiciona token à blacklist.

        Fluxo:
        1. Faz login
        2. Faz logout (passa refresh token)
        3. Tenta usar refresh token novamente (deve falhar)
        """
        # 1. Fazer login
        login_url = reverse("token_obtain_pair")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"],
        }
        login_response = api_client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]
        refresh_token = login_response.data["refresh"]

        # 2. Fazer logout
        logout_url = reverse("logout")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_response = api_client.post(
            logout_url, {"refresh": refresh_token}, format="json"
        )

        assert logout_response.status_code == status.HTTP_205_RESET_CONTENT

        # 3. Tentar usar refresh token (deve falhar)
        refresh_url = reverse("token_refresh")
        refresh_response = api_client.post(
            refresh_url, {"refresh": refresh_token}, format="json"
        )

        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_unauthenticated(self, api_client):
        """
        Teste: Logout sem autenticação falha.
        """
        url = reverse("logout")
        response = api_client.post(url, {"refresh": "any_token"}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================
# TESTES DE PERMISSÕES (SUPERUSER)
# ============================================


@pytest.mark.django_db
class TestSuperuserPermissions:
    """
    Testes específicos para verificar permissões de superusuário.
    """

    def test_superuser_login(self, api_client, superuser_data, create_superuser):
        """
        Teste: Superusuário consegue fazer login normalmente.
        """
        url = reverse("token_obtain_pair")
        login_data = {
            "username": superuser_data["username"],
            "password": superuser_data["password"],
        }
        response = api_client.post(url, login_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_superuser_flag_in_user_detail(
        self, api_client, superuser_data, create_superuser
    ):
        """
        Teste: Endpoint /user/ retorna is_superuser=True para superusuários.

        Por que testar isso?
        - O frontend precisa saber se o usuário é super admin
        - Permite mostrar/ocultar funcionalidades baseado em permissão
        """
        # Login
        login_url = reverse("token_obtain_pair")
        login_data = {
            "username": superuser_data["username"],
            "password": superuser_data["password"],
        }
        login_response = api_client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]

        # Acessar /user/
        user_url = reverse("user_detail")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = api_client.get(user_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_superuser"] is True
        assert response.data["is_staff"] is True

    def test_regular_user_not_superuser(self, api_client, user_data, create_user):
        """
        Teste: Usuário comum tem is_superuser=False.
        """
        # Login
        login_url = reverse("token_obtain_pair")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"],
        }
        login_response = api_client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]

        # Acessar /user/
        user_url = reverse("user_detail")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = api_client.get(user_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_superuser"] is False
