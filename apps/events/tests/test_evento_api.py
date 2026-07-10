from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.events.models import Categoria, Evento

# ============================================
# FIXTURES
# ============================================


@pytest.fixture
def api_client():
    """Cliente API do DRF."""
    return APIClient()


@pytest.fixture
def categoria_evento(db):
    """Cria uma categoria de evento para testes."""
    return Categoria.objects.create(nome="Concurso de Cosplay", tipo="evento")


@pytest.fixture
def evento_futuro(db, categoria_evento):
    """Cria um evento futuro para testes."""
    return Evento.objects.create(
        titulo="Anima Luanda 2026",
        descricao="Maior evento de anime de Angola",
        data_inicio=timezone.now() + timedelta(days=60),
        data_fim=timezone.now() + timedelta(days=62),
        local="Centro de Convenções de Talatona",
        categoria=categoria_evento,
        tipo_evento="concurso",
        abrangencia="nacional",
        status="publicado",
    )


@pytest.fixture
def evento_passado(db, categoria_evento):
    """Cria um evento passado para testes."""
    return Evento.objects.create(
        titulo="Anima Luanda 2024",
        descricao="Evento que já aconteceu",
        data_inicio=timezone.now() - timedelta(days=60),
        data_fim=timezone.now() - timedelta(days=58),
        local="Centro de Convenções",
        categoria=categoria_evento,
        tipo_evento="concurso",
        abrangencia="nacional",
        status="finalizado",
    )


@pytest.fixture
def superuser(db):
    """Cria um superusuário para testes."""
    return User.objects.create_superuser(
        username="admin", email="admin@test.com", password="AdminPass123!"
    )


@pytest.fixture
def authenticated_superuser_client(api_client, superuser):
    """Cliente autenticado como super admin."""
    # Fazer login
    login_url = reverse("token_obtain_pair")
    response = api_client.post(
        login_url, {"username": "admin", "password": "AdminPass123!"}, format="json"
    )
    token = response.data["access"]

    # Configurar token no cliente
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


# ============================================
# TESTES DE LISTAGEM (GET /api/events/)
# ============================================


@pytest.mark.django_db
class TestEventoList:
    """Testes para listagem de eventos."""

    def test_list_eventos_public(self, api_client, evento_futuro, evento_passado):
        """
        Teste: Qualquer pessoa pode listar eventos (acesso público).
        """
        url = reverse("evento-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data  # Paginação
        assert len(response.data["results"]) == 2
        assert response.data["count"] == 2

    def test_list_eventos_pagination(self, api_client, categoria_evento):
        """
        Teste: Paginação funciona corretamente.
        """
        # Criar 15 eventos
        for i in range(15):
            Evento.objects.create(
                titulo=f"Evento {i}",
                data_inicio=timezone.now() + timedelta(days=i),
                categoria=categoria_evento,
                tipo_evento="workshop",
                status="publicado",
            )

        url = reverse("evento-list")

        # Página 1 (padrão: 10 itens)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 10
        assert response.data["count"] == 15
        assert response.data["total_pages"] == 2

        # Página 2
        response = api_client.get(url, {"page": 2})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 5

    def test_list_eventos_custom_page_size(self, api_client, categoria_evento):
        """
        Teste: Cliente pode customizar tamanho da página.
        """
        # Criar 25 eventos
        for i in range(25):
            Evento.objects.create(
                titulo=f"Evento {i}",
                data_inicio=timezone.now() + timedelta(days=i),
                categoria=categoria_evento,
                tipo_evento="workshop",
                status="publicado",
            )

        url = reverse("evento-list")
        response = api_client.get(url, {"page_size": 20})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 20

    def test_list_eventos_ordering(self, api_client, categoria_evento):
        """
        Teste: Ordenação funciona corretamente.
        """
        # Criar eventos com datas diferentes
        evento1 = Evento.objects.create(
            titulo="Evento A",
            data_inicio=timezone.now() + timedelta(days=10),
            categoria=categoria_evento,
            tipo_evento="workshop",
            status="publicado",
        )
        evento2 = Evento.objects.create(
            titulo="Evento B",
            data_inicio=timezone.now() + timedelta(days=5),
            categoria=categoria_evento,
            tipo_evento="workshop",
            status="publicado",
        )

        url = reverse("evento-list")

        # Ordenar por data_inicio crescente
        response = api_client.get(url, {"ordering": "data_inicio"})
        assert response.data["results"][0]["id"] == str(evento2.id)

        # Ordenar por data_inicio decrescente
        response = api_client.get(url, {"ordering": "-data_inicio"})
        assert response.data["results"][0]["id"] == str(evento1.id)


# ============================================
# TESTES DE FILTROS
# ============================================


@pytest.mark.django_db
class TestEventoFilters:
    """Testes para filtros de eventos."""

    def test_filter_by_categoria(self, api_client, evento_futuro):
        """
        Teste: Filtrar por categoria funciona.
        """
        url = reverse("evento-list")
        response = api_client.get(url, {"categoria": str(evento_futuro.categoria.id)})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_filter_by_tipo_evento(self, api_client, categoria_evento):
        """
        Teste: Filtrar por tipo de evento funciona.
        """
        Evento.objects.create(
            titulo="Workshop",
            data_inicio=timezone.now() + timedelta(days=5),
            categoria=categoria_evento,
            tipo_evento="workshop",
            status="publicado",
        )
        Evento.objects.create(
            titulo="Concurso",
            data_inicio=timezone.now() + timedelta(days=10),
            categoria=categoria_evento,
            tipo_evento="concurso",
            status="publicado",
        )

        url = reverse("evento-list")
        response = api_client.get(url, {"tipo_evento": "workshop"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["tipo_evento"] == "workshop"

    def test_filter_by_status(self, api_client, evento_futuro, evento_passado):
        """
        Teste: Filtrar por status funciona.
        """
        url = reverse("evento-list")
        response = api_client.get(url, {"status": "publicado"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_filter_by_data_range(self, api_client, categoria_evento):
        """
        Teste: Filtrar por range de data funciona.
        """
        hoje = timezone.now()

        # Evento próximo
        Evento.objects.create(
            titulo="Próximo",
            data_inicio=hoje + timedelta(days=5),
            categoria=categoria_evento,
            tipo_evento="workshop",
            status="publicado",
        )

        # Evento distante
        Evento.objects.create(
            titulo="Distante",
            data_inicio=hoje + timedelta(days=100),
            categoria=categoria_evento,
            tipo_evento="workshop",
            status="publicado",
        )

        url = reverse("evento-list")

        # Filtrar eventos nos próximos 30 dias
        data_limite = (hoje + timedelta(days=30)).isoformat()
        response = api_client.get(url, {"data_inicio_before": data_limite})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_search_eventos(self, api_client, categoria_evento):
        """
        Teste: Busca por texto funciona.
        """
        Evento.objects.create(
            titulo="Anima Luanda",
            descricao="Evento de anime",
            data_inicio=timezone.now() + timedelta(days=5),
            local="Talatona",
            categoria=categoria_evento,
            tipo_evento="concurso",
            status="publicado",
        )
        Evento.objects.create(
            titulo="Workshop de Cosplay",
            descricao="Aprenda técnicas",
            data_inicio=timezone.now() + timedelta(days=10),
            local="Centro",
            categoria=categoria_evento,
            tipo_evento="workshop",
            status="publicado",
        )

        url = reverse("evento-list")

        # Buscar por "anima"
        response = api_client.get(url, {"search": "anima"})
        assert response.data["count"] == 1

        # Buscar por "talatona" (local)
        response = api_client.get(url, {"search": "talatona"})
        assert response.data["count"] == 1


# ============================================
# TESTES DE DETALHES (GET /api/events/{id}/)
# ============================================


@pytest.mark.django_db
class TestEventoDetail:
    """Testes para detalhes de um evento específico."""

    def test_retrieve_evento_public(self, api_client, evento_futuro):
        """
        Teste: Qualquer pessoa pode ver detalhes de um evento.
        """
        url = reverse("evento-detail", kwargs={"pk": evento_futuro.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["titulo"] == evento_futuro.titulo
        assert "categoria" in response.data
        assert "dias_ate_evento" in response.data
        assert "duracao_dias" in response.data

    def test_retrieve_evento_not_found(self, api_client):
        """
        Teste: Retorna 404 quando evento não existe.
        """
        url = reverse(
            "evento-detail", kwargs={"pk": "00000000-0000-0000-0000-000000000000"}
        )
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================
# TESTES DE CRIAÇÃO (POST /api/events/)
# ============================================


@pytest.mark.django_db
class TestEventoCreate:
    """Testes para criação de eventos."""

    def test_create_evento_as_superuser(
        self, authenticated_superuser_client, categoria_evento
    ):
        """
        Teste: Super admin pode criar eventos.
        """
        url = reverse("evento-list")
        data = {
            "titulo": "Novo Evento",
            "descricao": "Descrição do evento",
            "data_inicio": (timezone.now() + timedelta(days=30)).isoformat(),
            "data_fim": (timezone.now() + timedelta(days=32)).isoformat(),
            "local": "Local do evento",
            "categoria_id": str(categoria_evento.id),
            "tipo_evento": "workshop",
            "abrangencia": "nacional",
            "status": "rascunho",
        }

        response = authenticated_superuser_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["titulo"] == "Novo Evento"
        assert Evento.objects.filter(titulo="Novo Evento").exists()

    def test_create_evento_unauthenticated(self, api_client, categoria_evento):
        """
        Teste: Usuário não autenticado NÃO pode criar eventos.
        """
        url = reverse("evento-list")
        data = {
            "titulo": "Evento Inválido",
            "categoria_id": str(categoria_evento.id),
        }

        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_evento_validation_errors(
        self, authenticated_superuser_client, categoria_evento
    ):
        """
        Teste: Validações funcionam corretamente.
        """
        url = reverse("evento-list")

        # Sem título (obrigatório)
        data = {
            "descricao": "Sem título",
            "categoria_id": str(categoria_evento.id),
        }
        response = authenticated_superuser_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "titulo" in response.data

    def test_create_evento_data_fim_before_inicio(
        self, authenticated_superuser_client, categoria_evento
    ):
        """
        Teste: Data fim não pode ser antes de data início.
        """
        url = reverse("evento-list")
        data = {
            "titulo": "Evento com data errada",
            "data_inicio": (timezone.now() + timedelta(days=30)).isoformat(),
            "data_fim": (timezone.now() + timedelta(days=20)).isoformat(),  # Antes!
            "categoria_id": str(categoria_evento.id),
            "tipo_evento": "workshop",
        }

        response = authenticated_superuser_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "data_fim" in response.data


# ============================================
# TESTES DE ATUALIZAÇÃO
# ============================================


@pytest.mark.django_db
class TestEventoUpdate:
    """Testes para atualização de eventos."""

    def test_update_evento_as_superuser(
        self, authenticated_superuser_client, evento_futuro
    ):
        """
        Teste: Super admin pode atualizar eventos.
        """
        url = reverse("evento-detail", kwargs={"pk": evento_futuro.id})
        data = {
            "titulo": "Título Atualizado",
            "descricao": evento_futuro.descricao,
            "data_inicio": evento_futuro.data_inicio.isoformat(),
            "categoria_id": str(evento_futuro.categoria.id),
            "tipo_evento": evento_futuro.tipo_evento,
        }

        response = authenticated_superuser_client.put(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["titulo"] == "Título Atualizado"

    def test_partial_update_evento(self, authenticated_superuser_client, evento_futuro):
        """
        Teste: PATCH permite atualização parcial.
        """
        url = reverse("evento-detail", kwargs={"pk": evento_futuro.id})
        data = {"titulo": "Apenas Título Mudou"}

        response = authenticated_superuser_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["titulo"] == "Apenas Título Mudou"
        # Outros campos permanecem iguais
        assert response.data["descricao"] == evento_futuro.descricao


# ============================================
# TESTES DE DELEÇÃO
# ============================================


@pytest.mark.django_db
class TestEventoDelete:
    """Testes para deleção de eventos."""

    def test_delete_evento_as_superuser(
        self, authenticated_superuser_client, evento_futuro
    ):
        """
        Teste: Super admin pode deletar eventos.
        """
        url = reverse("evento-detail", kwargs={"pk": evento_futuro.id})
        response = authenticated_superuser_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Evento.objects.filter(id=evento_futuro.id).exists()

    def test_delete_evento_unauthenticated(self, api_client, evento_futuro):
        """
        Teste: Usuário não autenticado NÃO pode deletar.
        """
        url = reverse("evento-detail", kwargs={"pk": evento_futuro.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert Evento.objects.filter(id=evento_futuro.id).exists()


# ============================================
# TESTES DE ACTIONS CUSTOMIZADAS
# ============================================


@pytest.mark.django_db
class TestEventoCustomActions:
    """Testes para actions customizadas."""

    def test_proximos_eventos(self, api_client, evento_futuro, evento_passado):
        """
        Teste: /proximos/ retorna apenas eventos futuros.
        """
        url = reverse("evento-proximos")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == str(evento_futuro.id)

    def test_passados_eventos(self, api_client, evento_futuro, evento_passado):
        """
        Teste: /passados/ retorna apenas eventos passados.
        """
        url = reverse("evento-passados")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == str(evento_passado.id)

    def test_destaques_eventos(self, api_client, categoria_evento):
        """
        Teste: /destaques/ retorna os próximos 3 eventos.
        """
        # Criar 5 eventos futuros
        for i in range(5):
            Evento.objects.create(
                titulo=f"Evento {i}",
                data_inicio=timezone.now() + timedelta(days=i + 1),
                categoria=categoria_evento,
                tipo_evento="workshop",
                status="publicado",
            )

        url = reverse("evento-destaques")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_relacionados_eventos(self, api_client, evento_futuro, categoria_evento):
        """
        Teste: /{id}/relacionados/ retorna eventos da mesma categoria.
        """
        # Criar outro evento na mesma categoria
        evento2 = Evento.objects.create(
            titulo="Evento Relacionado",
            data_inicio=timezone.now() + timedelta(days=70),
            categoria=categoria_evento,
            tipo_evento="concurso",
            status="publicado",
        )

        url = reverse("evento-relacionados", kwargs={"pk": evento_futuro.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == str(evento2.id)
