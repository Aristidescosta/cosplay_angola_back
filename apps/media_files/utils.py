import mimetypes

import cloudinary.uploader
from django.conf import settings
from django.core.exceptions import ValidationError


def validate_image(file):
    """
    Valida arquivo de imagem antes do upload.

    Validações:
    - Tipo de arquivo (MIME type)
    - Tamanho máximo (5MB)
    - Extensão permitida

    Args:
        file: Arquivo Django (UploadedFile)

    Raises:
        ValidationError: Se arquivo for inválido
    """
    # Validar tamanho
    max_size = settings.CLOUDINARY_UPLOAD_PRESET["max_file_size"]
    if file.size > max_size:
        raise ValidationError(
            f"Arquivo muito grande. Tamanho máximo: {max_size / (1024 * 1024):.1f}MB"
        )

    # Validar tipo MIME
    allowed_mimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    ]

    # Tentar detectar MIME type
    mime_type = mimetypes.guess_type(file.name)[0]
    if not mime_type:
        # Fallback: usar content_type do arquivo
        mime_type = getattr(file, "content_type", None)

    if mime_type not in allowed_mimes:
        raise ValidationError(
            "Tipo de arquivo não suportado. Permitidos: JPG, PNG, WebP, GIF"
        )

    # Validar extensão
    allowed_extensions = settings.CLOUDINARY_UPLOAD_PRESET["allowed_formats"]
    extension = file.name.split(".")[-1].lower()

    if extension not in allowed_extensions:
        raise ValidationError(
            (
                "Extensão não permitida. Permitidas: "
                f"{', '.join(allowed_extensions).upper()}"
            )
        )

    return True


def upload_image_to_cloudinary(file, folder=None, public_id=None):
    """
    Faz upload de imagem para o Cloudinary.

    Args:
        file: Arquivo Django (UploadedFile)
        folder: Pasta no Cloudinary (opcional, padrão: cosplay_angola)
        public_id: ID público customizado (opcional)

    Returns:
        dict: Informações do upload com 'url', 'secure_url', 'public_id', etc.

    Raises:
        ValidationError: Se upload falhar
    """
    # Validar arquivo antes do upload
    validate_image(file)

    # Preparar opções de upload
    upload_options = {
        "folder": folder or settings.CLOUDINARY_UPLOAD_PRESET["folder"],
        "allowed_formats": settings.CLOUDINARY_UPLOAD_PRESET["allowed_formats"],
        "transformation": settings.CLOUDINARY_UPLOAD_PRESET["transformation"],
        "resource_type": "image",
    }

    # Adicionar public_id se fornecido
    if public_id:
        upload_options["public_id"] = public_id

    try:
        # Fazer upload
        result = cloudinary.uploader.upload(file, **upload_options)
        return result

    except Exception as e:
        raise ValidationError(f"Erro ao fazer upload da imagem: {str(e)}")


def delete_image_from_cloudinary(public_id):
    """
    Deleta imagem do Cloudinary.

    Args:
        public_id: ID público da imagem no Cloudinary

    Returns:
        dict: Resultado da deleção
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        print(f"Erro ao deletar imagem do Cloudinary: {e}")
        return {"result": "error", "error": str(e)}


def get_optimized_url(public_id, width=None, height=None, crop="fill", quality="auto"):
    """
    Gera URL otimizada da imagem com transformações.

    Args:
        public_id: ID público da imagem no Cloudinary
        width: Largura desejada (opcional)
        height: Altura desejada (opcional)
        crop: Modo de crop ('fill', 'fit', 'scale', 'thumb')
        quality: Qualidade ('auto', 'auto:best', 'auto:good', 'auto:eco')

    Returns:
        str: URL otimizada

    Exemplos:
        # Thumbnail 300x300
        url = get_optimized_url('my-image', width=300, height=300)

        # Banner responsivo
        url = get_optimized_url('my-image', width=1200, quality='auto:best')
    """
    transformation = {
        "quality": quality,
        "fetch_format": "auto",  # WebP se suportado
    }

    if width:
        transformation["width"] = width

    if height:
        transformation["height"] = height

    if width and height:
        transformation["crop"] = crop

    url, options = cloudinary.utils.cloudinary_url(public_id, **transformation)

    return url
