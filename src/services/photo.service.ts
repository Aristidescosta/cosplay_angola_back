import { prisma } from '../config/database';
import { MultipartFile } from '@fastify/multipart';
import { UpdatePhotoInput, PublishPhotoInput } from '../schemas/photo.schema';
import {
  validateImageFile,
  validateFileSize,
  generateUniqueFilename,
  generateS3Keys,
} from '../utils/file-upload';
import { ImageProcessor } from '../utils/image-processor';
import { GalleryService } from './gallery.service';

const galleryService = new GalleryService();

export class PhotoService {
  /**
   * Upload de foto
   */
  async upload(
    file: MultipartFile,
    galleryId: string,
    userId: string,
    caption?: string,
    tags?: string[]
  ) {
    // 1. Verificar se galeria existe e se user tem permissão
    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) {
      throw new Error('Galeria não encontrada');
    }

    // Verificar se é o dono da galeria
    if (gallery.photographerId !== userId) {
      throw new Error('Sem permissões para fazer upload nesta galeria');
    }

    // 2. Validar ficheiro
    validateImageFile(file);

    // 3. Ler ficheiro para buffer
    const buffer = await file.toBuffer();
    validateFileSize(buffer.length);

    // 4. Gerar nome único
    const { filename } = generateUniqueFilename(file.filename);

    // 5. Gerar chaves S3 (caminhos)
    const keys = generateS3Keys(filename, galleryId);

    // 6. Processar imagem (gerar thumbnails, etc)
    const processed = await ImageProcessor.processUpload(buffer, filename);

    // 7. Criar registo na BD
    const photo = await prisma.photo.create({
      data: {
        galleryId,
        filename: file.filename,
        s3Key: keys.largeKey,
        thumbnailKey: keys.thumbnailKey,
        mediumKey: keys.mediumKey,
        largeKey: keys.largeKey,
        originalKey: keys.originalKey,
        width: processed.dimensions.width,
        height: processed.dimensions.height,
        fileSize: processed.fileSize,
        mimeType: file.mimetype,
        caption: caption || null,
        tags: tags || [],
        published: true,
        order: 0, // será atualizado depois
      },
    });

    // 8. Atualizar contador de fotos na galeria
    await galleryService.updatePhotoCount(galleryId);

    return photo;
  }

  /**
   * Upload múltiplo de fotos
   */
  async uploadMultiple(
    files: MultipartFile[],
    galleryId: string,
    userId: string
  ) {
    const results = [];

    for (const file of files) {
      try {
        const photo = await this.upload(file, galleryId, userId);
        results.push({ success: true, photo });
      } catch (error: any) {
        results.push({
          success: false,
          filename: file.filename,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Listar fotos
   */
  async list(filters?: {
    galleryId?: string;
    published?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.galleryId) {
      where.galleryId = filters.galleryId;
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        include: {
          gallery: {
            select: {
              id: true,
              title: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [
          { order: 'asc' },
          { uploadedAt: 'desc' },
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.photo.count({ where }),
    ]);

    return {
      photos,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Obter foto por ID
   */
  async getById(id: string) {
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        gallery: {
          include: {
            event: true,
            photographer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      throw new Error('Foto não encontrada');
    }

    return photo;
  }

  /**
   * Atualizar foto
   */
  async update(
    id: string,
    data: UpdatePhotoInput,
    userId: string,
    userRole: string
  ) {
    const photo = await this.getById(id);

    // Verificar permissões
    if (photo.gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para editar esta foto');
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: {
        caption: data.caption,
        tags: data.tags,
        order: data.order,
        published: data.published,
      },
    });

    return updated;
  }

  /**
   * Publicar/despublicar foto
   */
  async publish(
    id: string,
    data: PublishPhotoInput,
    userId: string,
    userRole: string
  ) {
    const photo = await this.getById(id);

    // Verificar permissões
    if (photo.gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para publicar esta foto');
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: {
        published: data.published,
      },
    });

    return updated;
  }

  /**
   * Apagar foto
   */
  async delete(id: string, userId: string, userRole: string) {
    const photo = await this.getById(id);

    // Verificar permissões
    if (photo.gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para apagar esta foto');
    }

    // Apagar ficheiros do filesystem
    const filename = photo.s3Key.split('/').pop()!;
    await ImageProcessor.deleteImage(filename);

    // Apagar da BD
    await prisma.photo.delete({
      where: { id },
    });

    // Atualizar contador da galeria
    await galleryService.updatePhotoCount(photo.galleryId);

    return { message: 'Foto apagada com sucesso' };
  }

  /**
   * Reordenar fotos numa galeria
   */
  async reorder(galleryId: string, photoIds: string[]) {
    // Atualizar ordem de cada foto
    const updates = photoIds.map((photoId, index) =>
      prisma.photo.update({
        where: { id: photoId },
        data: { order: index },
      })
    );

    await Promise.all(updates);

    return { message: 'Fotos reordenadas com sucesso' };
  }
}