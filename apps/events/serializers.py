from django.utils import timezone
from rest_framework import serializers

from .models import Categoria, Evento, Parceiro

# ============================================
# SERIALIZER DA CATEGORIA (Nested)
# ============================================


class CategoriaSerializer(serializers.ModelSerializer):
    """
    Serializer simples de Categoria.
    Usado dentro de EventoSerializer (nested/aninhado).

    Por que criar um serializer separado?
    - Evita repetição de código
    - Facilita reutilização
    - Mantém código organizado
    """

    class Meta:
        model = Categoria
        fields = ["id", "nome", "slug", "tipo"]
        read_only_fields = ["id", "slug"]


# ============================================
# SERIALIZER DE PARCEIRO (Nested)
# ============================================


class ParceiroSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer simples de Parceiro.
    Usado na listagem de eventos (não precisa de todos os campos).
    """

    class Meta:
        model = Parceiro
        fields = ["id", "nome", "tipo", "logo_url"]
        read_only_fields = ["id"]


# ============================================
# SERIALIZER DE LISTAGEM (Lista de eventos)
# ============================================


class EventoListSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem de eventos.

    Características:
    - Retorna menos campos (mais rápido)
    - Inclui categoria aninhada (nested)
    - Ideal para GET /api/events/

    Por que não retornar tudo?
    - Performance: menos dados = resposta mais rápida
    - UX: lista não precisa de todos os detalhes
    - Economia de banda: importante para mobile
    """

    # Nested serializer - retorna objeto completo da categoria
    categoria = CategoriaSerializer(read_only=True)

    # Campo calculado - não existe no banco, é gerado na hora
    dias_ate_evento = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = [
            "id",
            "titulo",
            "slug",
            "data_inicio",
            "data_fim",
            "local",
            "categoria",
            "tipo_evento",
            "abrangencia",
            "status",
            "imagem_destaque",
            "dias_ate_evento",
        ]
        read_only_fields = ["id", "slug"]

    def get_dias_ate_evento(self, obj):
        """
        Calcula quantos dias faltam para o evento.

        Útil para o frontend mostrar "Faltam 30 dias".

        Returns:
            int: Dias até o evento (negativo se já passou)
            None: Se data_inicio não existe
        """
        if not obj.data_inicio:
            return None

        hoje = timezone.now()
        delta = obj.data_inicio - hoje
        return delta.days


# ============================================
# SERIALIZER DE DETALHES (Um evento específico)
# ============================================


class EventoDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalhes completos de um evento.

    Características:
    - Retorna TODOS os campos
    - Inclui relacionamentos completos
    - Campos calculados extras
    - Ideal para GET /api/events/1/
    """

    categoria = CategoriaSerializer(read_only=True)
    parceiros = ParceiroSimpleSerializer(many=True, read_only=True)

    # Campos calculados
    dias_ate_evento = serializers.SerializerMethodField()
    duracao_dias = serializers.SerializerMethodField()
    ja_aconteceu = serializers.SerializerMethodField()

    # URL completa (se precisar)
    url = serializers.HyperlinkedIdentityField(
        view_name="evento-detail", lookup_field="pk"
    )

    class Meta:
        model = Evento
        fields = [
            "id",
            "url",
            "titulo",
            "slug",
            "descricao",
            "data_inicio",
            "data_fim",
            "local",
            "categoria",
            "tipo_evento",
            "abrangencia",
            "status",
            "imagem_destaque",
            "parceiros",
            "dias_ate_evento",
            "duracao_dias",
            "ja_aconteceu",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_dias_ate_evento(self, obj):
        """Quantos dias faltam para o evento."""
        if not obj.data_inicio:
            return None

        hoje = timezone.now()
        delta = obj.data_inicio - hoje
        return delta.days

    def get_duracao_dias(self, obj):
        """
        Quantos dias o evento dura.

        Returns:
            int: Duração em dias
            None: Se não tem data_fim ou é evento de 1 dia
        """
        if not obj.data_fim or not obj.data_inicio:
            return 1  # Evento de 1 dia por padrão

        delta = obj.data_fim - obj.data_inicio
        return max(1, delta.days + 1)  # +1 porque conta o dia inteiro

    def get_ja_aconteceu(self, obj):
        """
        Verifica se o evento já aconteceu.

        Returns:
            bool: True se já passou, False se ainda vai acontecer
        """
        if not obj.data_inicio:
            return False

        # Se tem data_fim, verifica ela; senão verifica data_inicio
        data_final = obj.data_fim if obj.data_fim else obj.data_inicio
        return timezone.now() > data_final


# ============================================
# SERIALIZER DE CRIAÇÃO/ATUALIZAÇÃO
# ============================================


class EventoCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para criar e atualizar eventos.

    Características:
    - Validações customizadas
    - Campos obrigatórios explícitos
    - Mensagens de erro claras
    - Ideal para POST /api/events/ e PUT/PATCH /api/events/1/
    """

    # Campo categoria aceita apenas o ID
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.filter(tipo="evento"),
        source="categoria",
        required=True,
        error_messages={
            "required": "Categoria é obrigatória.",
            "does_not_exist": "Categoria não encontrada.",
        },
    )

    # Parceiros aceita lista de IDs
    parceiros_ids = serializers.PrimaryKeyRelatedField(
        queryset=Parceiro.objects.filter(ativo=True),
        source="parceiros",
        many=True,
        required=False,
        error_messages={
            "does_not_exist": "Um ou mais parceiros não foram encontrados.",
        },
    )

    class Meta:
        model = Evento
        fields = [
            "titulo",
            "descricao",
            "data_inicio",
            "data_fim",
            "local",
            "categoria_id",
            "tipo_evento",
            "abrangencia",
            "status",
            "imagem_destaque",
            "parceiros_ids",
        ]

    def validate_data_inicio(self, value):
        """
        Valida data de início.

        Regras:
        - Não pode ser no passado (para eventos novos)
        - Pode ser no passado (para editar eventos antigos)
        """
        # Se está criando (não tem instance), não permite data no passado
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError("Data de início não pode ser no passado.")
        return value

    def validate(self, attrs):
        """
        Validações que envolvem múltiplos campos.

        Args:
            attrs: Dicionário com todos os dados validados

        Returns:
            dict: Dados validados

        Raises:
            ValidationError: Se alguma regra for violada
        """
        data_inicio = attrs.get("data_inicio")
        data_fim = attrs.get("data_fim")

        # Se tem data_fim, valida que é depois de data_inicio
        if data_fim and data_inicio and data_fim < data_inicio:
            raise serializers.ValidationError(
                {"data_fim": "Data de término deve ser posterior à data de início."}
            )

        # Se data_fim é muito distante (mais de 1 ano), avisa
        if data_fim and data_inicio:
            delta = data_fim - data_inicio
            if delta.days > 365:
                raise serializers.ValidationError(
                    {"data_fim": "Evento não pode durar mais de 1 ano."}
                )

        return attrs

    def to_representation(self, instance):
        """
        Customiza a resposta após criar/atualizar.

        Por que fazer isso?
        - Ao criar/atualizar, queremos retornar os detalhes completos
        - Não apenas os IDs, mas os objetos completos
        - Usa EventoDetailSerializer para isso

        Returns:
            dict: Representação completa do evento
        """
        # Usa o serializer de detalhes para a resposta
        return EventoDetailSerializer(instance, context=self.context).data
