from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsSuperUserOrReadOnly

from .models import Evento
from .pagination import EventoPagination
from .serializers import (
    EventoCreateUpdateSerializer,
    EventoDetailSerializer,
    EventoListSerializer,
)

# ============================================
# FILTERSET (Filtros customizados)
# ============================================


class EventoFilter(filters.FilterSet):
    """
    Filtros customizados para eventos.

    Permite buscar eventos por:
    - Categoria (exata)
    - Tipo de evento
    - Status
    - Data (range, antes, depois)
    - Busca em título/descrição

    Uso:
        GET /api/events/?categoria=uuid
        GET /api/events/?tipo_evento=concurso
        GET /api/events/?status=publicado
        GET /api/events/?data_inicio_after=2025-01-01
        GET /api/events/?search=anima
    """

    # Filtro de categoria (por ID)
    categoria = filters.UUIDFilter(field_name="categoria__id")

    # Filtro de categoria por slug (alternativa)
    categoria_slug = filters.CharFilter(
        field_name="categoria__slug", lookup_expr="iexact"
    )

    # Filtro de tipo de evento
    tipo_evento = filters.ChoiceFilter(choices=Evento.TIPO_CHOICES)

    # Filtro de status
    status = filters.ChoiceFilter(choices=Evento.STATUS_CHOICES)

    # Filtro de abrangência
    abrangencia = filters.ChoiceFilter(choices=Evento.ABRANGENCIA_CHOICES)

    # Filtros de data
    data_inicio_after = filters.DateTimeFilter(
        field_name="data_inicio",
        lookup_expr="gte",  # greater than or equal
        label="Data de início após",
    )

    data_inicio_before = filters.DateTimeFilter(
        field_name="data_inicio",
        lookup_expr="lte",  # less than or equal
        label="Data de início antes de",
    )

    # Busca em múltiplos campos
    search = filters.CharFilter(method="filter_search", label="Buscar")

    class Meta:
        model = Evento
        fields = [
            "categoria",
            "categoria_slug",
            "tipo_evento",
            "status",
            "abrangencia",
        ]

    def filter_search(self, queryset, name, value):
        """
        Busca em título, descrição e local.

        Exemplo:
            GET /api/events/?search=luanda
            Retorna eventos que têm "luanda" no título, descrição ou local
        """
        return (
            queryset.filter(titulo__icontains=value)
            | queryset.filter(descricao__icontains=value)
            | queryset.filter(local__icontains=value)
        )


# ============================================
# VIEWSET DE EVENTOS
# ============================================


class EventoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de eventos.

    Endpoints gerados automaticamente:
    - GET    /api/events/          → list()      (Lista todos)
    - POST   /api/events/          → create()    (Cria novo)
    - GET    /api/events/{id}/     → retrieve()  (Detalhes de um)
    - PUT    /api/events/{id}/     → update()    (Atualiza completo)
    - PATCH  /api/events/{id}/     → partial_update() (Atualiza parcial)
    - DELETE /api/events/{id}/     → destroy()   (Deleta)

    Funcionalidades extras:
    - Paginação automática
    - Filtros por categoria, tipo, status, data
    - Busca por texto
    - Ordenação customizada
    - Actions customizadas (próximos, passados, destacados)

    Permissões:
    - GET: Qualquer pessoa (público)
    - POST/PUT/PATCH/DELETE: Apenas super admins
    """

    pagination_class = EventoPagination
    queryset = (
        Evento.objects.all().select_related("categoria").prefetch_related("parceiros")
    )
    permission_classes = [IsSuperUserOrReadOnly]  # Leitura pública, escrita só admin
    filterset_class = EventoFilter
    search_fields = ["titulo", "descricao", "local"]  # Para busca padrão do DRF
    ordering_fields = ["data_inicio", "created_at", "titulo"]
    ordering = ["-data_inicio"]  # Ordenação padrão: mais recentes primeiro

    def get_serializer_class(self):
        """
        Retorna o serializer apropriado para cada ação.

        Por que fazer isso?
        - list() usa serializer de listagem (menos campos)
        - retrieve() usa serializer de detalhes (todos os campos)
        - create/update usam serializer com validações

        Returns:
            class: Classe do serializer a ser usada
        """
        if self.action == "list":
            return EventoListSerializer
        elif self.action == "retrieve":
            return EventoDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return EventoCreateUpdateSerializer
        return EventoDetailSerializer

    def get_queryset(self):
        """
        Retorna o queryset customizado.

        Otimizações:
        - select_related: JOIN com categoria (evita N+1 queries)
        - prefetch_related: JOIN otimizado com parceiros

        Returns:
            QuerySet: Queryset otimizado
        """
        queryset = super().get_queryset()

        # Adiciona filtros extras via query params
        # Exemplo: /api/events/?proximos=true
        if self.request.query_params.get("proximos"):
            queryset = queryset.filter(data_inicio__gte=timezone.now())

        if self.request.query_params.get("passados"):
            queryset = queryset.filter(data_inicio__lt=timezone.now())

        return queryset

    # ============================================
    # ACTIONS CUSTOMIZADAS
    # ============================================

    @action(detail=False, methods=["get"])
    def proximos(self, request):
        """
        Retorna apenas eventos futuros.

        Endpoint: GET /api/events/proximos/

        Query params opcionais:
        - limit: Quantos eventos retornar (padrão: 10)

        Exemplo:
            GET /api/events/proximos/?limit=5
        """
        limit = int(request.query_params.get("limit", 10))

        eventos = (
            self.get_queryset()
            .filter(data_inicio__gte=timezone.now(), status="publicado")
            .order_by("data_inicio")[:limit]
        )

        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def passados(self, request):
        """
        Retorna apenas eventos que já aconteceram.

        Endpoint: GET /api/events/passados/
        """
        limit = int(request.query_params.get("limit", 10))

        eventos = (
            self.get_queryset()
            .filter(data_inicio__lt=timezone.now())
            .order_by("-data_inicio")[:limit]
        )

        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def destaques(self, request):
        """
        Retorna eventos em destaque (futuro, para implementar no model).

        Endpoint: GET /api/events/destaques/

        Por enquanto retorna os próximos 3 eventos.
        """
        eventos = (
            self.get_queryset()
            .filter(data_inicio__gte=timezone.now(), status="publicado")
            .order_by("data_inicio")[:3]
        )

        serializer = EventoDetailSerializer(
            eventos, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def relacionados(self, request, pk=None):
        """
        Retorna eventos relacionados (mesma categoria).

        Endpoint: GET /api/events/{id}/relacionados/
        """
        evento = self.get_object()

        eventos_relacionados = (
            self.get_queryset()
            .filter(categoria=evento.categoria, status="publicado")
            .exclude(id=evento.id)[:5]
        )

        serializer = EventoListSerializer(
            eventos_relacionados, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """
        Customiza a deleção de eventos.

        Opção 1: Soft delete (recomendado)
        - Apenas marca como deletado, não remove do banco
        - Permite recuperar depois

        Opção 2: Hard delete (cuidado!)
        - Remove permanentemente do banco

        Por enquanto: hard delete (super().perform_destroy)
        """
        # TODO: Implementar soft delete no futuro
        # instance.status = 'deletado'
        # instance.save()

        super().perform_destroy(instance)
