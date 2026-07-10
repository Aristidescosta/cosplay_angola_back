import { prisma } from '../config/database';

export class SearchService {
  async search(q: string) {
    const term = q.trim();

    const [events, galleries, tags] = await Promise.all([
      prisma.event.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          date: true,
          location: true,
          coverImageUrl: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),

      prisma.gallery.findMany({
        where: {
          published: true,
          event: { published: true },
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          photoCount: true,
          event: {
            select: { id: true, title: true, slug: true },
          },
          photographer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      prisma.tag.findMany({
        where: {
          name: { contains: term, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          usageCount: true,
        },
        orderBy: { usageCount: 'desc' },
        take: 8,
      }),
    ]);

    return { events, galleries, tags };
  }
}
