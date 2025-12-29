from django.contrib import admin

from .models import (  # noqa: F401
    Categoria,
    Evento,
    EventoParceiro,
    Newsletter,
    Parceiro,
)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    """
    Configuração do admin para Categoria.
    O decorator @admin.register substitui admin.site.register().
    """

    # Campos exibidos na listagem
    list_display = ["nome", "tipo", "slug", "created_at"]

    # Filtros na barra lateral
    list_filter = ["tipo", "created_at"]

    # Campos de busca
    search_fields = ["nome", "slug"]

    # Campos readonly (não editáveis)
    readonly_fields = ["id", "created_at"]


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    """
    Configuração do admin para Evento.
    Interface mais rica porque Evento é uma entidade complexa.
    """

    list_display = [
        "titulo",
        "tipo_evento",
        "data_inicio",
        "status",
        "categoria",
        "abrangencia",
    ]

    list_filter = ["tipo_evento", "status", "abrangencia", "categoria", "data_inicio"]

    search_fields = ["titulo", "slug", "descricao", "local"]

    readonly_fields = ["id", "slug", "created_at", "updated_at"]

    # Organiza os campos em seções visuais no formulário
    fieldsets = (
        (
            "Informações Básicas",
            {"fields": ("titulo", "descricao", "categoria")},
        ),
        ("Data e Local", {"fields": ("data_inicio", "data_fim", "local")}),
        ("Classificação", {"fields": ("tipo_evento", "abrangencia", "status")}),
        ("Mídia", {"fields": ("imagem_destaque",)}),
        (
            "Metadados",
            {
                "fields": ("id", "slug", "created_at", "updated_at"),
                "classes": ("collapse",),  # Começa colapsado
            },
        ),
    )

    # Ordenação padrão (mais recentes primeiro)
    ordering = ["-data_inicio"]

    # Quantos itens por página
    list_per_page = 25


@admin.register(Parceiro)
class ParceiroAdmin(admin.ModelAdmin):
    """Configuração do admin para Parceiro."""

    list_display = ["nome", "tipo", "ativo", "created_at"]
    list_filter = ["tipo", "ativo", "created_at"]
    search_fields = ["nome", "descricao"]
    readonly_fields = ["id", "created_at"]

    fieldsets = (
        ("Informações Básicas", {"fields": ("nome", "tipo", "descricao", "ativo")}),
        ("Links", {"fields": ("logo_url", "site")}),
        ("Metadados", {"fields": ("id", "created_at"), "classes": ("collapse",)}),
    )


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    """Configuração do admin para Newsletter."""

    list_display = ["email", "nome", "ativo", "data_inscricao", "data_confirmacao"]
    list_filter = ["ativo", "data_inscricao"]
    search_fields = ["email", "nome"]
    readonly_fields = ["id", "data_inscricao"]

    # Ação personalizada: marcar como ativo/inativo em massa
    actions = ["ativar_assinantes", "desativar_assinantes"]

    def ativar_assinantes(self, request, queryset):
        """Ativa assinantes selecionados em massa."""
        count = queryset.update(ativo=True)
        self.message_user(request, f"{count} assinante(s) ativado(s).")

    ativar_assinantes.short_description = "Ativar assinantes selecionados"

    def desativar_assinantes(self, request, queryset):
        """Desativa assinantes selecionados em massa."""
        count = queryset.update(ativo=False)
        self.message_user(request, f"{count} assinante(s) desativado(s).")

    desativar_assinantes.short_description = "Desativar assinantes selecionados"
