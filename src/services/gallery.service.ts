import { prisma } from '../config/database';
import { CreateGalleryInput, UpdateGalleryInput, PublishGalleryInput } from '../schemas/gallery.schema';

export class GalleryService {
  /**
   * Criar nova galeria
   */
  async create(data: CreateGalleryInput, photographerId: string) {
    // Verificar se evento existe
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Criar galeria
    const gallery = await prisma.gallery.create({
      data: {
        eventId: data.eventId,
        photographerId,
        title: data.title,
        description: data.description,
        published: false,
      },
      include: {
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
            email: true,
          },
        },
      },
    });

    return gallery;
  }

  /**
   * Listar galerias com filtros
   */
  async list(filters?: {
    eventId?: string;
    photographerId?: string;
    published?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.eventId) {
      where.eventId = filters.eventId;
    }

    if (filters?.photographerId) {
      where.photographerId = filters.photographerId;
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [galleries, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              date: true,
            },
          },
          photographer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              photos: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      prisma.gallery.count({ where }),
    ]);

    return {
      galleries,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Obter galeria por ID
   */
  async getById(id: string) {
    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
            location: true,
          },
        },
        photographer: {
          select: {
            id: true,
            name: true,
            email: true,
            photographer: {
              select: {
                bio: true,
                instagram: true,
                portfolioUrl: true,
              },
            },
          },
        },
        photos: {
          where: { published: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            filename: true,
            s3Key: true,
            thumbnailKey: true,
            mediumKey: true,
            width: true,
            height: true,
            tags: true,
            caption: true,
            order: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    });

    if (!gallery) {
      throw new Error('Galeria não encontrada');
    }

    return gallery;
  }

  /**
   * Obter galerias de um evento específico
   */
  async getByEventId(eventId: string, includeUnpublished = false) {
    const where: any = { eventId };

    if (!includeUnpublished) {
      where.published = true;
    }

    const galleries = await prisma.gallery.findMany({
      where,
      include: {
        photographer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return galleries;
  }

  /**
   * Atualizar galeria
   */
  async update(id: string, data: UpdateGalleryInput, userId: string, userRole: string) {
    const gallery = await this.getById(id);

    // Verificar permissões: só o dono ou ADMIN pode atualizar
    if (gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para editar esta galeria');
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        coverPhotoId: data.coverPhotoId,
        published: data.published,
      },
      include: {
        event: true,
        photographer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Publicar/despublicar galeria
   */
  async publish(id: string, data: PublishGalleryInput, userId: string, userRole: string) {
    const gallery = await this.getById(id);

    // Verificar permissões
    if (gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para publicar esta galeria');
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        published: data.published,
      },
    });

    return updated;
  }

  /**
   * Apagar galeria
   */
  async delete(id: string, userId: string, userRole: string) {
    const gallery = await this.getById(id);

    // Verificar permissões
    if (gallery.photographerId !== userId && userRole !== 'ADMIN') {
      throw new Error('Sem permissões para apagar esta galeria');
    }

    // Apagar galeria (cascade vai apagar fotos)
    await prisma.gallery.delete({
      where: { id },
    });

    return { message: 'Galeria apagada com sucesso' };
  }

  /**
   * Atualizar contador de fotos (chamado quando foto é adicionada/removida)
   */
  async updatePhotoCount(galleryId: string) {
    const photoCount = await prisma.photo.count({
      where: { galleryId },
    });

    await prisma.gallery.update({
      where: { id: galleryId },
      data: { photoCount },
    });
  }
}