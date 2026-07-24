import { prisma } from '../config/database';
import { storageService } from './storage.service';

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export class DashboardService {
  async getStats() {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const [
      totalEvents,
      eventsThisMonth,
      eventsLastMonth,
      totalGalleries,
      galleriesThisWeek,
      galleriesLastWeek,
      totalPhotos,
      photosLast30Days,
      photosPrev30Days,
      photographersThisMonth,
      photographersLastMonth,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.event.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),

      prisma.gallery.count(),
      prisma.gallery.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.gallery.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfWeek } } }),

      prisma.photo.count(),
      prisma.photo.count({ where: { uploadedAt: { gte: thirtyDaysAgo } } }),
      prisma.photo.count({ where: { uploadedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),

      prisma.user.count({
        where: {
          role: 'PHOTOGRAPHER',
          galleries: { some: { createdAt: { gte: startOfMonth } } },
        },
      }),
      prisma.user.count({
        where: {
          role: 'PHOTOGRAPHER',
          galleries: { some: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } },
        },
      }),
    ]);

    return {
      events: {
        total: totalEvents,
        change: calcChange(eventsThisMonth, eventsLastMonth),
        period: 'este mês',
      },
      galleries: {
        total: totalGalleries,
        change: calcChange(galleriesThisWeek, galleriesLastWeek),
        period: 'esta semana',
      },
      photos: {
        total: totalPhotos,
        change: calcChange(photosLast30Days, photosPrev30Days),
        period: 'últimos 30 dias',
      },
      photographers: {
        total: photographersThisMonth,
        change: calcChange(photographersThisMonth, photographersLastMonth),
        period: 'este mês',
      },
    };
  }

  async getRecentEvents(limit = 5) {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        coverImageUrl: true,
        published: true,
        _count: { select: { galleries: true } },
      },
    });

    return events.slice(0, limit).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      coverImageUrl: e.coverImageUrl,
      published: e.published,
      galleriesCount: e._count.galleries,
    }));
  }

  async getRecentUploads(limit = 8) {
    const photos = await prisma.photo.findMany({
      orderBy: { uploadedAt: 'desc' },
      where: { published: true },
      select: {
        id: true,
        thumbnailKey: true,
        caption: true,
        uploadedAt: true,
        gallery: {
          select: {
            title: true,
            event: { select: { title: true, slug: true } },
          },
        },
      },
    });

    return photos.slice(0, limit).map((p) => ({
      id: p.id,
      thumbnailUrl: p.thumbnailKey ? storageService.getPublicUrl(p.thumbnailKey) : null,
      caption: p.caption,
      uploadedAt: p.uploadedAt,
      gallery: p.gallery.title,
      event: p.gallery.event?.title ?? null,
      eventSlug: p.gallery.event?.slug ?? null,
    }));
  }

  async getSummary() {
    const [stats, recentEvents, recentUploads] = await Promise.all([
      this.getStats(),
      this.getRecentEvents(),
      this.getRecentUploads(),
    ]);

    return { stats, recentEvents, recentUploads };
  }
}
