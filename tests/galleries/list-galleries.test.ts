import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.helper';
import { createTestUser } from '../helpers/auth.helper';
import { createTestEvent } from '../helpers/event.helper';
import { createTestGallery } from '../helpers/gallery.helper';

describe('GET /api/galleries', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('deve listar galerias (público)', async () => {
    const photographer = await createTestUser({ role: 'PHOTOGRAPHER' });
    const event = await createTestEvent();

    await createTestGallery({ eventId: event.id, photographerId: photographer.id, published: true });
    await createTestGallery({ eventId: event.id, photographerId: photographer.id, published: true });
    await createTestGallery({ eventId: event.id, photographerId: photographer.id, published: false });

    const response = await app.inject({
      method: 'GET',
      url: '/api/galleries',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.galleries).toHaveLength(3);
    expect(body.data.total).toBe(3);
  });

  it('deve filtrar apenas galerias publicadas', async () => {
    const photographer = await createTestUser({ role: 'PHOTOGRAPHER' });
    const event = await createTestEvent();

    await createTestGallery({ eventId: event.id, photographerId: photographer.id, published: true });
    await createTestGallery({ eventId: event.id, photographerId: photographer.id, published: true });
    await createTestGallery({ eventId: event.id, photographerId: photographer.id, published: false });

    const response = await app.inject({
      method: 'GET',
      url: '/api/galleries?published=true',
    });

    const body = JSON.parse(response.body);
    expect(body.data.galleries).toHaveLength(2);
  });

  it('deve filtrar por evento', async () => {
    const photographer = await createTestUser({ role: 'PHOTOGRAPHER' });
    const event1 = await createTestEvent({ title: 'Evento 1' });
    const event2 = await createTestEvent({ title: 'Evento 2' });

    await createTestGallery({ eventId: event1.id, photographerId: photographer.id });
    await createTestGallery({ eventId: event1.id, photographerId: photographer.id });
    await createTestGallery({ eventId: event2.id, photographerId: photographer.id });

    const response = await app.inject({
      method: 'GET',
      url: `/api/galleries?eventId=${event1.id}`,
    });

    const body = JSON.parse(response.body);
    expect(body.data.galleries).toHaveLength(2);
  });

  it('deve filtrar por fotógrafo', async () => {
    const photo1 = await createTestUser({ email: 'photo1@test.com', role: 'PHOTOGRAPHER' });
    const photo2 = await createTestUser({ email: 'photo2@test.com', role: 'PHOTOGRAPHER' });
    const event = await createTestEvent();

    await createTestGallery({ eventId: event.id, photographerId: photo1.id });
    await createTestGallery({ eventId: event.id, photographerId: photo1.id });
    await createTestGallery({ eventId: event.id, photographerId: photo2.id });

    const response = await app.inject({
      method: 'GET',
      url: `/api/galleries?photographerId=${photo1.id}`,
    });

    const body = JSON.parse(response.body);
    expect(body.data.galleries).toHaveLength(2);
  });
});