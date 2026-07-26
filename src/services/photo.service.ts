import { prisma } from '../config/database';
import { UpdatePhotoInput, PublishPhotoInput } from '../schemas/photo.schema';
import {
  validateImageFile,
  validateFileSize,
  generateUniqueFilename,
  generateS3Keys,
} from '../utils/file-upload';
import { ImageProcessor } from '../utils/image-processor';
import { storageService } from './storage.service';
import { GalleryService } from './gallery.service';
import { slugify } from '../utils/slug';

export interface FileInput {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

const galleryService = new GalleryService();

export class PhotoService {
  /**
   * Upload de foto — recebe buffer já lido pelo controller
   */
  async upload(
    file: FileInput,
    galleryId: string,
    userId: string,
    caption?: string,
    tags?: string[]
  ) {
    const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });

    if (!gallery) throw new Error('Galeria não encontrada');
    if (gallery.photographerId !== userId) throw new Error('Sem permissões para fazer upload nesta galeria');

    validateImageFile(file.mimetype);
    validateFileSize(file.buffer.length);

    const { filename } = generateUniqueFilename(file.filename);
    const keys = generateS3Keys(filename, galleryId);
    const processed = await ImageProcessor.processToBuffers(file.buffer);

    await Promise.all([
      storageService.upload(keys.originalKey, processed.buffers.original, 'image/jpeg'),
      storageService.upload(keys.thumbnailKey, processed.buffers.thumbnail, 'image/jpeg'),
      storageService.upload(keys.mediumKey, processed.buffers.medium, 'image/jpeg'),
      storageService.upload(keys.largeKey, processed.buffers.large, 'image/jpeg'),
    ]);

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
        order: 0,
      },
    });

    await Promise.all([
      this.incrementTagUsage(tags ?? []),
      galleryService.updatePhotoCount(galleryId),
    ]);

    return photo;
  }

  /**
   * Upload múltiplo — recebe buffers já lidos pelo controller
   */
  async uploadMultiple(files: FileInput[], galleryId: string, userId: string) {
    const results = [];

    for (const file of files) {
      try {
        const photo = await this.upload(file, galleryId, userId);
        results.push({ success: true, photo });
      } catch (error: any) {
        results.push({ success: false, filename: file.filename, error: error.message });
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
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.galleryId) {
      where.galleryId = filters.galleryId;
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;

      // Uma foto publicada cuja galeria (ou o evento dessa galeria) deixou
      // de estar publicada também deixa de ser considerada pública.
      if (filters.published) {
        where.gallery = {
          published: true,
          OR: [{ eventId: null }, { event: { published: true } }],
        };
      }
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.search) {
      where.OR = [
        { caption: { contains: filters.search, mode: 'insensitive' } },
        { filename: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search.toLowerCase()] } },
      ];
    }

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const allPhotos = await prisma.photo.findMany({
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
            photographer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { uploadedAt: 'desc' },
      ],
    });

    return {
      photos: allPhotos.slice(offset, offset + limit),
      total: allPhotos.length,
      limit,
      offset,
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

    if (data.tags !== undefined) {
      const oldTags = photo.tags;
      const newTags = data.tags;
      const added = newTags.filter((t) => !oldTags.includes(t));
      const removed = oldTags.filter((t) => !newTags.includes(t));
      await Promise.all([
        this.incrementTagUsage(added),
        this.decrementTagUsage(removed),
      ]);
    }

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

    if (photo.gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para apagar esta foto');
    }

    const keysToDelete = [
      photo.originalKey,
      photo.thumbnailKey,
      photo.mediumKey,
      photo.largeKey,
    ].filter((k): k is string => k !== null);

    await Promise.all(keysToDelete.map((key) => storageService.delete(key)));

    await prisma.photo.delete({ where: { id } });

    await Promise.all([
      this.decrementTagUsage(photo.tags),
      galleryService.updatePhotoCount(photo.galleryId),
    ]);

    return { message: 'Foto apagada com sucesso' };
  }

  /**
   * Apagar várias fotos de uma vez
   */
  async deleteMany(ids: string[], userId: string, userRole: string) {
    const photos = await prisma.photo.findMany({
      where: { id: { in: ids } },
      include: { gallery: { select: { photographerId: true } } },
    });

    if (photos.length === 0) {
      throw new Error('Nenhuma foto encontrada');
    }

    if (userRole !== 'ADMIN') {
      const unauthorized = photos.some((p) => p.gallery.photographerId !== userId);
      if (unauthorized) {
        throw new Error('Sem permissões para apagar uma ou mais fotos');
      }
    }

    const keysToDelete = photos
      .flatMap((p) => [p.originalKey, p.thumbnailKey, p.mediumKey, p.largeKey])
      .filter((k): k is string => k !== null);

    await Promise.all(keysToDelete.map((key) => storageService.delete(key)));

    await prisma.photo.deleteMany({ where: { id: { in: ids } } });

    const allTags = photos.flatMap((p) => p.tags);
    const galleryIds = [...new Set(photos.map((p) => p.galleryId))];

    await Promise.all([
      this.decrementTagUsage(allTags),
      ...galleryIds.map((gId) => galleryService.updatePhotoCount(gId)),
    ]);

    return { deleted: photos.length };
  }

  /**
   * Reordenar fotos numa galeria
   */
  async reorder(galleryId: string, photoIds: string[]) {
    const updates = photoIds.map((photoId, index) =>
      prisma.photo.update({
        where: { id: photoId },
        data: { order: index },
      })
    );

    await Promise.all(updates);

    return { message: 'Fotos reordenadas com sucesso' };
  }

  // ── helpers privados ────────────────────────────────────────────────────────

  private async incrementTagUsage(names: string[]): Promise<void> {
    if (names.length === 0) return;
    const bySlug = new Map<string, { name: string; count: number }>();
    for (const name of names) {
      const slug = slugify(name);
      const entry = bySlug.get(slug);
      if (entry) {
        entry.count += 1;
      } else {
        bySlug.set(slug, { name, count: 1 });
      }
    }
    await Promise.all(
      Array.from(bySlug.entries()).map(([slug, { name, count }]) =>
        prisma.tag.upsert({
          where: { slug },
          create: { name, slug, usageCount: count },
          update: { usageCount: { increment: count } },
        })
      )
    );
  }

  // GREATEST(0, usageCount - n) via raw SQL para garantir que nunca fica negativo
  private async decrementTagUsage(names: string[]): Promise<void> {
    if (names.length === 0) return;
    const counts = new Map<string, number>();
    for (const name of names) {
      const slug = slugify(name);
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    await Promise.all(
      Array.from(counts.entries()).map(([slug, count]) =>
        prisma.$executeRaw`
          UPDATE tags
          SET "usageCount" = GREATEST(0, "usageCount" - ${count})
          WHERE slug = ${slug}
        `
      )
    );
  }
}
