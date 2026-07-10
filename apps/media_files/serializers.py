from rest_framework import serializers

from .models import Midia
from .utils import upload_image_to_cloudinary


class ImageUploadSerializer(serializers.Serializer):
    """
    Serializer para upload de imagens.

    Uso:
        POST /api/media/upload/
        Content-Type: multipart/form-data

        Body:
        - image: arquivo da imagem
        - titulo: título da imagem (opcional)
        - descricao: descrição (opcional)
    """

    image = serializers.ImageField(
        required=True, help_text="Arquivo de imagem (JPG, PNG, WebP, GIF)"
    )

    titulo = serializers.CharField(
        max_length=200, required=False, allow_blank=True, help_text="Título da imagem"
    )

    descricao = serializers.CharField(
        required=False, allow_blank=True, help_text="Descrição da imagem"
    )

    creditos_fotografo = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Nome do fotógrafo"
    )

    def create(self, validated_data):
        """
        Faz upload da imagem e cria registro no banco.

        Returns:
            Midia: Instância do model Midia com dados do upload
        """
        image_file = validated_data.pop("image")

        # Upload para Cloudinary
        cloudinary_result = upload_image_to_cloudinary(
            image_file, folder="cosplay_angola/eventos"
        )

        # Criar registro no banco
        midia = Midia.objects.create(
            titulo=validated_data.get("titulo", image_file.name),
            descricao=validated_data.get("descricao", ""),
            arquivo_url=cloudinary_result["secure_url"],
            tipo="imagem",
            formato=cloudinary_result["format"],
            tamanho_kb=cloudinary_result["bytes"] // 1024,
            largura=cloudinary_result.get("width"),
            altura=cloudinary_result.get("height"),
            creditos_fotografo=validated_data.get("creditos_fotografo", ""),
        )

        return midia


class MidiaSerializer(serializers.ModelSerializer):
    """
    Serializer para listar/detalhar mídias.
    """

    # URLs otimizadas em diferentes tamanhos
    thumbnail_url = serializers.SerializerMethodField()
    medium_url = serializers.SerializerMethodField()
    large_url = serializers.SerializerMethodField()

    class Meta:
        model = Midia
        fields = [
            "id",
            "titulo",
            "descricao",
            "arquivo_url",
            "thumbnail_url",
            "medium_url",
            "large_url",
            "tipo",
            "formato",
            "tamanho_kb",
            "largura",
            "altura",
            "creditos_fotografo",
            "data_captura",
            "destaque",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_thumbnail_url(self, obj):
        """URL otimizada 300x300 (thumbnail)."""
        if obj.arquivo_url and "cloudinary.com" in obj.arquivo_url:
            from .utils import get_optimized_url

            # Extrair public_id da URL do Cloudinary
            public_id = obj.arquivo_url.split("/upload/")[1].split(".")[0]
            return get_optimized_url(public_id, width=300, height=300, crop="thumb")
        return obj.arquivo_url

    def get_medium_url(self, obj):
        """URL otimizada 800px de largura (médio)."""
        if obj.arquivo_url and "cloudinary.com" in obj.arquivo_url:
            from .utils import get_optimized_url

            public_id = obj.arquivo_url.split("/upload/")[1].split(".")[0]
            return get_optimized_url(public_id, width=800)
        return obj.arquivo_url

    def get_large_url(self, obj):
        """URL otimizada 1600px de largura (grande)."""
        if obj.arquivo_url and "cloudinary.com" in obj.arquivo_url:
            from .utils import get_optimized_url

            public_id = obj.arquivo_url.split("/upload/")[1].split(".")[0]
            return get_optimized_url(public_id, width=1600, quality="auto:best")
        return obj.arquivo_url
