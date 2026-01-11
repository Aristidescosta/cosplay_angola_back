from django.utils import timezone
from rest_framework import serializers

from apps.media_files.utils import (
    delete_image_from_cloudinary,
    upload_image_to_cloudinary,
)

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
    AGORA COM SUPORTE A UPLOAD DE IMAGEM!
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

    # NOVO: Campo para upload de imagem
    imagem = serializers.ImageField(
        required=False,
        write_only=True,  # Não retorna na resposta
        help_text="Arquivo de imagem para o evento (JPG, PNG, WebP, GIF)",
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
            "imagem_destaque",  # URL (pode vir preenchida ou vazia)
            "imagem",  # Arquivo (novo)
            "parceiros_ids",
        ]

    def validate_data_inicio(self, value):
        """Valida data de início."""
        if not self.instance and value < timezone.now():
            raise serializers.ValidationError("Data de início não pode ser no passado.")
        return value

    def validate(self, attrs):
        """Validações que envolvem múltiplos campos."""
        data_inicio = attrs.get("data_inicio")
        data_fim = attrs.get("data_fim")

        # Validar data_fim
        if data_fim and data_inicio and data_fim < data_inicio:
            raise serializers.ValidationError(
                {"data_fim": "Data de término deve ser posterior à data de início."}
            )

        # Validar duração
        if data_fim and data_inicio:
            delta = data_fim - data_inicio
            if delta.days > 365:
                raise serializers.ValidationError(
                    {"data_fim": "Evento não pode durar mais de 1 ano."}
                )

        return attrs

    def create(self, validated_data):
        """
        Cria evento com upload de imagem (se fornecida).
        """
        # Extrair imagem (se houver)
        imagem_file = validated_data.pop("imagem", None)

        # Criar evento
        evento = super().create(validated_data)

        # Se tem imagem, fazer upload
        if imagem_file:
            try:
                cloudinary_result = upload_image_to_cloudinary(
                    imagem_file, folder=f"cosplay_angola/eventos/{evento.slug}"
                )

                # Atualizar URL da imagem
                evento.imagem_destaque = cloudinary_result["secure_url"]
                evento.save(update_fields=["imagem_destaque"])

            except Exception as e:
                # Se falhar upload, deletar evento criado
                evento.delete()
                raise serializers.ValidationError(
                    {"imagem": f"Erro ao fazer upload da imagem: {str(e)}"}
                )

        return evento

    def update(self, instance, validated_data):
        """
        Atualiza evento com upload de nova imagem (se fornecida).
        """
        # Extrair nova imagem (se houver)
        imagem_file = validated_data.pop("imagem", None)

        # Guardar URL antiga (para deletar depois)
        old_image_url = instance.imagem_destaque

        # Atualizar evento
        evento = super().update(instance, validated_data)

        # Se tem nova imagem, fazer upload
        if imagem_file:
            try:
                cloudinary_result = upload_image_to_cloudinary(
                    imagem_file, folder=f"cosplay_angola/eventos/{evento.slug}"
                )

                # Atualizar URL da imagem
                evento.imagem_destaque = cloudinary_result["secure_url"]
                evento.save(update_fields=["imagem_destaque"])

                # Deletar imagem antiga do Cloudinary (se existir)
                if old_image_url and "cloudinary.com" in old_image_url:
                    try:
                        parts = old_image_url.split("/upload/")
                        if len(parts) > 1:
                            public_id = parts[1].rsplit(".", 1)[0]
                            delete_image_from_cloudinary(public_id)
                    except:  # noqa: E722
                        pass  # Não falhar se deletar imagem antiga falhar

            except Exception as e:
                raise serializers.ValidationError(
                    {"imagem": f"Erro ao fazer upload da imagem: {str(e)}"}
                )

        return evento

    def to_representation(self, instance):
        """Retorna detalhes completos do evento."""
        return EventoDetailSerializer(instance, context=self.context).data
