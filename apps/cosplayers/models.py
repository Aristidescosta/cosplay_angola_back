import uuid

from autoslug import AutoSlugField
from django.db import models


class Cosplayer(models.Model):
    """
    Perfil de um cosplayer cadastrado no acervo.
    Armazena informações pessoais, artísticas e redes sociais.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Nome real (obrigatório)
    nome = models.CharField(max_length=150, help_text="Nome real do cosplayer")

    # Nome artístico (opcional)
    nome_artistico = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Nome artístico ou apelido usado no cosplay",
    )

    slug = AutoSlugField(
        populate_from="nome",
        max_length=200,
        unique=True,
        help_text="URL amigável gerada automaticamente do nome",
    )

    biografia = models.TextField(
        blank=True, null=True, help_text="Biografia e história no cosplay"
    )

    # Foto de perfil
    foto_perfil = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL da foto de perfil (Cloudinary)",
    )

    # Redes sociais (todas opcionais)
    instagram = models.CharField(
        max_length=100, blank=True, null=True, help_text="Username do Instagram (sem @)"
    )

    facebook = models.CharField(
        max_length=100, blank=True, null=True, help_text="Username ou URL do Facebook"
    )

    tiktok = models.CharField(
        max_length=100, blank=True, null=True, help_text="Username do TikTok (sem @)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cosplayers"
        verbose_name = "Cosplayer"
        verbose_name_plural = "Cosplayers"
        ordering = ["nome"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["nome"]),
        ]

    def __str__(self):
        # Se tiver nome artístico, mostra "Nome Real (Nome Artístico)"
        if self.nome_artistico:
            return f"{self.nome} ({self.nome_artistico})"
        return self.nome

    def get_display_name(self):
        """
        Método útil que retorna o nome a ser exibido:
        prioriza nome artístico se existir, senão usa o nome real.
        """
        return self.nome_artistico if self.nome_artistico else self.nome
