import uuid

from autoslug import AutoSlugField
from django.db import models


class Categoria(models.Model):
    """
    Categorias para classificar eventos e coleções.
    Ex: "Concurso de Cosplay", "Exposição Temática", "Workshop"
    """

    # UUID em vez de ID numérico - mais seguro e único globalmente
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Identificador único da categoria",
    )

    # Nome da categoria (obrigatório, até 100 caracteres)
    nome = models.CharField(
        max_length=100, help_text="Nome da categoria (ex: Concurso de Cosplay)"
    )

    # Slug para URLs amigáveis (gerado automaticamente do nome)
    slug = AutoSlugField(
        populate_from="nome",
        unique=True,
        max_length=250,
        help_text="URL amigável gerada automaticamente do nome",
    )

    # Descrição opcional
    descricao = models.TextField(
        blank=True, null=True, help_text="Descrição detalhada da categoria"
    )

    # Tipo: para evento ou para coleção?
    TIPO_CHOICES = [
        ("evento", "Evento"),
        ("colecao", "Coleção"),
    ]
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        help_text="Esta categoria é para eventos ou coleções?",
    )

    # Timestamp de criação (preenchido automaticamente)
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Data de criação do registro"
    )

    class Meta:
        # Nome da tabela no banco (plural em português)
        db_table = "categorias"
        # Como aparece no Django Admin
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        # Ordenação padrão: alfabética por nome
        ordering = ["nome"]

    def __str__(self):
        # Como o objeto aparece quando impresso
        return f"{self.nome} ({self.get_tipo_display()})"


class Evento(models.Model):
    """
    Eventos cobertos pelo Cosplay Angola.
    Pode ser concurso, exposição, workshop ou cobertura de evento externo.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    titulo = models.CharField(
        max_length=200, help_text="Título do evento (ex: Anima Luanda 2025)"
    )

    slug = AutoSlugField(
        populate_from="titulo",
        unique=True,
        max_length=250,
        help_text="URL amigável gerada automaticamente do título",
    )

    descricao = models.TextField(
        blank=True, null=True, help_text="Descrição completa do evento"
    )

    # Datas do evento
    data_inicio = models.DateTimeField(help_text="Data e hora de início do evento")

    data_fim = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Data e hora de término (opcional para eventos de 1 dia)",
    )

    local = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Local onde ocorre o evento (ex: Centro de Convenções de Talatona)",
    )

    # RELACIONAMENTO: Um evento pertence a uma categoria
    # on_delete=PROTECT: não deixa apagar categoria se tiver eventos usando ela
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="eventos",
        help_text="Categoria deste evento",
    )

    # Tipo de evento
    TIPO_CHOICES = [
        ("concurso", "Concurso de Cosplay"),
        ("exposicao", "Exposição"),
        ("workshop", "Workshop"),
        ("cobertura", "Cobertura de Evento"),
    ]
    tipo_evento = models.CharField(
        max_length=20, choices=TIPO_CHOICES, help_text="Qual o tipo deste evento?"
    )

    # Abrangência
    ABRANGENCIA_CHOICES = [
        ("nacional", "Nacional"),
        ("internacional", "Internacional"),
    ]
    abrangencia = models.CharField(
        max_length=20,
        choices=ABRANGENCIA_CHOICES,
        default="nacional",
        help_text="Abrangência do evento",
    )

    # Status da publicação
    STATUS_CHOICES = [
        ("rascunho", "Rascunho"),
        ("publicado", "Publicado"),
        ("finalizado", "Finalizado"),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="rascunho",
        help_text="Status atual do evento",
    )

    # Imagem de destaque
    imagem_destaque = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL da imagem de capa do evento (Cloudinary)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "eventos"
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"
        ordering = ["-data_inicio"]  # Mais recentes primeiro
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["data_inicio"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.titulo} - {self.data_inicio.strftime('%d/%m/%Y')}"


class Parceiro(models.Model):
    """
    Parceiros do projeto: patrocinadores, apoiadores, mídia parceira, etc.
    Podem ser vinculados a eventos específicos para dar créditos.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    nome = models.CharField(
        max_length=150, help_text="Nome da empresa/instituição parceira"
    )

    # Tipo de parceria
    TIPO_CHOICES = [
        ("patrocinador", "Patrocinador"),
        ("apoio", "Apoio"),
        ("midia", "Mídia Parceira"),
        ("institucional", "Parceiro Institucional"),
    ]
    tipo = models.CharField(
        max_length=20, choices=TIPO_CHOICES, help_text="Tipo de parceria"
    )

    # Logo do parceiro
    logo_url = models.URLField(
        max_length=500, blank=True, null=True, help_text="URL do logo (Cloudinary)"
    )

    site = models.URLField(
        max_length=200, blank=True, null=True, help_text="Site oficial do parceiro"
    )

    descricao = models.TextField(
        blank=True, null=True, help_text="Descrição sobre o parceiro e a parceria"
    )

    # Se o parceiro está ativo (pode desativar sem apagar do banco)
    ativo = models.BooleanField(default=True, help_text="Parceiro ativo no momento?")

    # RELACIONAMENTO com Evento
    # Um parceiro pode estar em vários eventos, um evento pode ter vários parceiros
    eventos = models.ManyToManyField(
        Evento,
        through="EventoParceiro",
        related_name="parceiros",
        blank=True,
        help_text="Eventos que este parceiro apoia",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "parceiros"
        verbose_name = "Parceiro"
        verbose_name_plural = "Parceiros"
        ordering = ["nome"]
        indexes = [
            models.Index(fields=["tipo"]),
            models.Index(fields=["ativo"]),
        ]

    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"


class EventoParceiro(models.Model):
    """
    Tabela intermediária entre Evento e Parceiro.
    Permite especificar o tipo de apoio em cada evento.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)

    parceiro = models.ForeignKey(Parceiro, on_delete=models.CASCADE)

    # Tipo de apoio específico neste evento
    tipo_apoio = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Ex: Patrocínio Gold, Apoio de Mídia, etc",
    )

    class Meta:
        db_table = "evento_parceiro"
        verbose_name = "Parceiro do Evento"
        verbose_name_plural = "Parceiros dos Eventos"
        unique_together = [["evento", "parceiro"]]

    def __str__(self):
        return f"{self.parceiro.nome} em {self.evento.titulo}"


class Newsletter(models.Model):
    """
    Emails cadastrados na newsletter do site.
    Para envio de novidades sobre eventos, coleções, etc.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Email é único - não pode cadastrar o mesmo email duas vezes
    email = models.EmailField(
        max_length=150, unique=True, help_text="Email para receber a newsletter"
    )

    nome = models.CharField(
        max_length=150, blank=True, null=True, help_text="Nome do assinante (opcional)"
    )

    # Se a inscrição está ativa
    ativo = models.BooleanField(
        default=True,
        help_text="Deseja receber emails? (permite descadastrar sem apagar)",
    )

    # Datas de controle
    data_inscricao = models.DateTimeField(
        auto_now_add=True, help_text="Quando se inscreveu"
    )

    data_confirmacao = models.DateTimeField(
        blank=True, null=True, help_text="Quando confirmou o email (double opt-in)"
    )

    class Meta:
        db_table = "newsletter"
        verbose_name = "Assinante da Newsletter"
        verbose_name_plural = "Assinantes da Newsletter"
        ordering = ["-data_inscricao"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["ativo"]),
        ]

    def __str__(self):
        if self.nome:
            return f"{self.nome} ({self.email})"
        return self.email

    def is_confirmado(self):
        """Verifica se o email foi confirmado (double opt-in)."""
        return self.data_confirmacao is not None
