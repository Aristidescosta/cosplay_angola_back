import uuid

from django.db import models


class Midia(models.Model):
    """
    Arquivos de mídia (fotos e vídeos) do acervo.
    Cada arquivo tem seus metadados e pode estar em múltiplas coleções.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    titulo = models.CharField(
        max_length=200, blank=True, null=True, help_text="Título ou legenda da mídia"
    )

    descricao = models.TextField(
        blank=True, null=True, help_text="Descrição detalhada ou contexto da foto/vídeo"
    )

    # URL do arquivo no Cloudinary
    arquivo_url = models.URLField(
        max_length=500, help_text="URL completa do arquivo hospedado no Cloudinary"
    )

    # Tipo de mídia
    TIPO_CHOICES = [
        ("imagem", "Imagem"),
        ("video", "Vídeo"),
    ]
    tipo = models.CharField(
        max_length=10,
        choices=TIPO_CHOICES,
        default="imagem",
        help_text="Tipo de arquivo",
    )

    # Formato do arquivo (jpg, png, mp4, etc)
    formato = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Extensão do arquivo (jpg, png, mp4, etc)",
    )

    # Metadados técnicos
    tamanho_kb = models.IntegerField(
        blank=True, null=True, help_text="Tamanho do arquivo em kilobytes"
    )

    largura = models.IntegerField(
        blank=True, null=True, help_text="Largura em pixels (para imagens/vídeos)"
    )

    altura = models.IntegerField(
        blank=True, null=True, help_text="Altura em pixels (para imagens/vídeos)"
    )

    # Créditos
    creditos_fotografo = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Nome do fotógrafo/videomaker responsável",
    )

    data_captura = models.DateField(
        blank=True, null=True, help_text="Data em que a foto/vídeo foi capturado"
    )

    # Se está em destaque
    destaque = models.BooleanField(default=False, help_text="Mídia em destaque?")

    # RELACIONAMENTO MUITOS-PARA-MUITOS com Colecao
    colecoes = models.ManyToManyField(
        "cosplay_collections.Colecao",
        through="ColecaoMidia",
        related_name="midias",
        help_text="Coleções que contêm esta mídia",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "midias"
        verbose_name = "Mídia"
        verbose_name_plural = "Mídias"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tipo"]),
            models.Index(fields=["data_captura"]),
            models.Index(fields=["destaque"]),
        ]

    def __str__(self):
        return self.titulo if self.titulo else f"Mídia {self.id}"

    def get_tamanho_mb(self):
        """Retorna o tamanho em megabytes para exibição mais amigável."""
        if self.tamanho_kb:
            return round(self.tamanho_kb / 1024, 2)
        return None


class ColecaoMidia(models.Model):
    """
    Tabela intermediária (pivot) que conecta Mídias e Coleções.
    Permite informações extras sobre o relacionamento.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relacionamentos
    colecao = models.ForeignKey(
        "cosplay_collections.Colecao",
        on_delete=models.CASCADE,
        help_text="Coleção que contém a mídia",
    )

    midia = models.ForeignKey(
        Midia, on_delete=models.CASCADE, help_text="Mídia incluída na coleção"
    )

    # Campos extras do relacionamento
    ordem = models.PositiveIntegerField(
        default=0, help_text="Ordem de exibição desta mídia na coleção"
    )

    descricao_contexto = models.TextField(
        blank=True, null=True, help_text="Contexto específico desta mídia nesta coleção"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "colecao_midia"
        verbose_name = "Mídia da Coleção"
        verbose_name_plural = "Mídias das Coleções"
        ordering = ["colecao", "ordem"]
        # Garante que a mesma mídia não seja adicionada duas vezes na mesma coleção
        unique_together = [["colecao", "midia"]]

    def __str__(self):
        return f"{self.midia} em {self.colecao}"
