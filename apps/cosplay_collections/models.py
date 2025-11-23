import uuid

from django.db import models


class Colecao(models.Model):
    """
    Coleção fotográfica/audiovisual produzida pela equipe.
    Pode ser vinculada a um evento específico, a um cosplayer, ou ser temática.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    titulo = models.CharField(
        max_length=200, help_text="Título da coleção (ex: Especial Anima Luanda 2025)"
    )

    slug = models.SlugField(
        max_length=250, unique=True, help_text="URL amigável da coleção"
    )

    descricao = models.TextField(
        blank=True, null=True, help_text="Descrição da coleção e contexto"
    )

    # Tipo de coleção
    TIPO_CHOICES = [
        ("cosplayer", "Ensaio de Cosplayer"),
        ("evento", "Cobertura de Evento"),
        ("tematica", "Coleção Temática"),
    ]
    tipo = models.CharField(
        max_length=20, choices=TIPO_CHOICES, help_text="Tipo desta coleção"
    )

    data_producao = models.DateField(
        blank=True, null=True, help_text="Data em que a produção foi realizada"
    )

    # Se está em destaque na home
    destaque = models.BooleanField(
        default=False, help_text="Exibir como destaque no site?"
    )

    # RELACIONAMENTOS OPCIONAIS
    # Uma coleção PODE estar vinculada a um evento (mas não obrigatoriamente)
    evento = models.ForeignKey(
        "events.Evento",  # String porque Evento está em outro app
        on_delete=models.SET_NULL,
        related_name="colecoes",
        blank=True,
        null=True,
        help_text="Evento relacionado (se for cobertura de evento)",
    )

    # Uma coleção PODE estar vinculada a um cosplayer (mas não obrigatoriamente)
    cosplayer = models.ForeignKey(
        "cosplayers.Cosplayer",  # String porque Cosplayer está em outro app
        on_delete=models.SET_NULL,
        related_name="colecoes",
        blank=True,
        null=True,
        help_text="Cosplayer principal (se for ensaio individual)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "colecoes"
        verbose_name = "Coleção"
        verbose_name_plural = "Coleções"
        ordering = ["-created_at"]  # Mais recentes primeiro
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["tipo"]),
            models.Index(fields=["destaque"]),
        ]

    def __str__(self):
        return f"{self.titulo} ({self.get_tipo_display()})"
