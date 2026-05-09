import { prisma } from '../config/database';
import { CreateEventInput, UpdateEventInput, PublishEventInput } from '../schemas/event.schema';

export class EventService {
  /**
   * Criar novo evento
   */
  async create(data: CreateEventInput) {
    const slug = this.generateSlug(data.title);

    const existingEvent = await prisma.event.findUnique({
      where: { slug },
    });

    if (existingEvent) {
      throw new Error('Já existe um evento com este título');
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        date: new Date(data.date),
        location: data.location,
        coverImageUrl: data.coverImageUrl,
        published: false, // sempre começa como não publicado
      },
    });

    return event;
  }

  /**
   * Listar todos os eventos
   * Com filtros opcionais
   */
  async list(filters?: {
    published?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          galleries: {
            select: {
              id: true,
              title: true,
              photoCount: true,
            },
          },
          _count: {
            select: {
              galleries: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Obter evento por ID
   */
  async getById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        galleries: {
          include: {
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
        },
      },
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    return event;
  }

  /**
   * Obter evento por slug
   */
  async getBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        galleries: {
          where: { published: true },
          include: {
            photographer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Evento não encontrado');
    }

    return event;
  }

  /**
   * Atualizar evento
   */
  async update(id: string, data: UpdateEventInput) {
    await this.getById(id);

    let slug: string | undefined;
    if (data.title) {
      slug = this.generateSlug(data.title);

      const existingEvent = await prisma.event.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingEvent) {
        throw new Error('Já existe um evento com este título');
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
        location: data.location,
        coverImageUrl: data.coverImageUrl,
        published: data.published,
      },
    });

    return event;
  }

  /**
   * Publicar/despublicar evento
   */
  async publish(id: string, data: PublishEventInput) {
    await this.getById(id);

    const event = await prisma.event.update({
      where: { id },
      data: {
        published: data.published,
      },
    });

    return event;
  }

  /**
   * Apagar evento
   */
  async delete(id: string) {
    await this.getById(id);

    await prisma.event.delete({
      where: { id },
    });

    return { message: 'Evento apagado com sucesso' };
  }

  /**
   * Gerar slug a partir do título
   * Ex: "CCXP Luanda 2024" -> "ccxp-luanda-2024"
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD') // Remove acentos
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços viram hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  }
}