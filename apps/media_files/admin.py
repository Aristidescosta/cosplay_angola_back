from django.contrib import admin

from .models import ColecaoMidia, Midia


class ColecaoMidiaInline(admin.TabularInline):
    """
    Inline para editar mídias dentro do formulário de Coleção.
    Permite adicionar/remover mídias direto na tela da coleção.
    """

    model = ColecaoMidia
    extra = 1  # Quantas linhas vazias mostrar para adicionar novas
    fields = ["midia", "ordem", "descricao_contexto"]
    autocomplete_fields = ["midia"]  # Campo com busca/autocomplete


@admin.register(Midia)
class MidiaAdmin(admin.ModelAdmin):
    """Configuração do admin para Mídia."""

    list_display = [
        "titulo",
        "tipo",
        "formato",
        "get_tamanho_display",
        "destaque",
        "created_at",
    ]

    list_filter = ["tipo", "formato", "destaque", "created_at"]
    search_fields = ["titulo", "descricao", "creditos_fotografo"]
    readonly_fields = ["id", "created_at"]

    fieldsets = (
        (
            "Informações Básicas",
            {"fields": ("titulo", "descricao", "tipo", "arquivo_url")},
        ),
        (
            "Metadados Técnicos",
            {"fields": ("formato", "tamanho_kb", "largura", "altura")},
        ),
        ("Créditos", {"fields": ("creditos_fotografo", "data_captura")}),
        ("Configurações", {"fields": ("destaque",)}),
        ("Sistema", {"fields": ("id", "created_at"), "classes": ("collapse",)}),
    )

    def get_tamanho_display(self, obj):
        """Exibe o tamanho em MB de forma amigável."""
        tamanho_mb = obj.get_tamanho_mb()
        if tamanho_mb:
            return f"{tamanho_mb} MB"
        return "-"

    get_tamanho_display.short_description = "Tamanho"

    ordering = ["-created_at"]
    list_per_page = 50


@admin.register(ColecaoMidia)
class ColecaoMidiaAdmin(admin.ModelAdmin):
    """Configuração do admin para a tabela pivot ColecaoMidia."""

    list_display = ["colecao", "midia", "ordem", "created_at"]
    list_filter = ["colecao", "created_at"]
    search_fields = ["colecao__titulo", "midia__titulo"]
    readonly_fields = ["id", "created_at"]

    ordering = ["colecao", "ordem"]
