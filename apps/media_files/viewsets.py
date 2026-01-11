from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsSuperUser

from .models import Midia
from .serializers import ImageUploadSerializer, MidiaSerializer
from .utils import delete_image_from_cloudinary


class MidiaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de mídias (imagens).

    Endpoints:
    - GET    /api/media/           → Listar todas
    - POST   /api/media/upload/    → Upload de imagem
    - GET    /api/media/{id}/      → Detalhes
    - DELETE /api/media/{id}/      → Deletar (remove do Cloudinary também)

    Permissões:
    - GET: Público
    - POST/DELETE: Apenas super admins
    """

    queryset = Midia.objects.filter(tipo="imagem").order_by("-created_at")
    serializer_class = MidiaSerializer
    parser_classes = (MultiPartParser, FormParser)  # Para aceitar multipart/form-data

    def get_permissions(self):
        """
        GET é público, POST/DELETE apenas para admins.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = []
        else:
            permission_classes = [IsSuperUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["post"])
    def upload(self, request):
        """
        Upload de imagem para o Cloudinary.

        Endpoint: POST /api/media/upload/
        Content-Type: multipart/form-data

        Body:
        - image: arquivo da imagem (obrigatório)
        - titulo: título (opcional)
        - descricao: descrição (opcional)
        - creditos_fotografo: nome do fotógrafo (opcional)

        Resposta 201:
        {
            "id": "uuid",
            "titulo": "Minha imagem",
            "arquivo_url": "https://res.cloudinary.com/...",
            "thumbnail_url": "https://res.cloudinary.com/.../c_thumb,w_300,h_300/...",
            "medium_url": "https://res.cloudinary.com/.../w_800/...",
            "large_url": "https://res.cloudinary.com/.../w_1600/...",
            ...
        }
        """
        serializer = ImageUploadSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            midia = serializer.save()

            # Retornar com todas as URLs otimizadas
            response_serializer = MidiaSerializer(midia, context={"request": request})

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except DjangoValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_destroy(self, instance):
        """
        Ao deletar, também remove do Cloudinary.
        """
        # Extrair public_id da URL do Cloudinary
        if instance.arquivo_url and "cloudinary.com" in instance.arquivo_url:
            try:
                parts = instance.arquivo_url.split("/upload/")
                if len(parts) > 1:
                    # Pegar tudo depois de /upload/ e remover extensão
                    public_id = parts[1].rsplit(".", 1)[0]
                    delete_image_from_cloudinary(public_id)
            except Exception as e:
                print(f"Erro ao deletar imagem do Cloudinary: {e}")

        # Deletar do banco
        super().perform_destroy(instance)
