from django.contrib import admin

from .models import Colecao


@admin.register(Colecao)
class ColecaoAdmin(admin.ModelAdmin):
    """Configuração do admin para Coleção."""

    list_display = ["titulo", "tipo", "destaque", "data_producao", "created_at"]
    list_filter = ["tipo", "destaque", "data_producao", "created_at"]
    search_fields = ["titulo", "slug", "descricao"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        ("Informações Básicas", {"fields": ("titulo", "slug", "descricao", "tipo")}),
        (
            "Vinculação",
            {
                "fields": ("evento", "cosplayer"),
                "description": "Vincule a um evento, cosplayer, ou deixe em branco para coleção temática.",  # noqa: E501
            },
        ),
        ("Configurações", {"fields": ("data_producao", "destaque")}),
        (
            "Metadados",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    # Filtro rápido para coleções em destaque
    list_editable = ["destaque"]  # Permite editar direto na listagem

    ordering = ["-created_at"]
    list_per_page = 25
