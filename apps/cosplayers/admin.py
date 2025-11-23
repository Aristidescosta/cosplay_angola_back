from django.contrib import admin

from .models import Cosplayer


@admin.register(Cosplayer)
class CosplayerAdmin(admin.ModelAdmin):
    """Configuração do admin para Cosplayer."""

    list_display = ["get_display_name", "nome", "instagram", "created_at"]
    search_fields = ["nome", "nome_artistico", "slug", "biografia"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        (
            "Identificação",
            {"fields": ("nome", "nome_artistico", "slug", "foto_perfil")},
        ),
        ("Sobre", {"fields": ("biografia",)}),
        ("Redes Sociais", {"fields": ("instagram", "facebook", "tiktok")}),
        (
            "Metadados",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    # Método customizado para exibir o nome de exibição na listagem
    def get_display_name(self, obj):
        """Retorna o nome artístico se existir, senão o nome real."""
        return obj.get_display_name()

    get_display_name.short_description = "Nome de Exibição"

    ordering = ["nome"]
    list_per_page = 30
