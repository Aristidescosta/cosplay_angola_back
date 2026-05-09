import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.helper';
import { createTestEvent } from '../helpers/event.helper';

describe('GET /api/events', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('deve listar eventos (público)', async () => {
    // Criar alguns eventos
    await createTestEvent({ title: 'Evento 1', published: true });
    await createTestEvent({ title: 'Evento 2', published: true });
    await createTestEvent({ title: 'Evento 3', published: false });

    const response = await app.inject({
      method: 'GET',
      url: '/api/events',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.events).toHaveLength(3);
    expect(body.data.total).toBe(3);
  });

  it('deve filtrar apenas eventos publicados', async () => {
    await createTestEvent({ published: true });
    await createTestEvent({ published: true });
    await createTestEvent({ published: false });

    const response = await app.inject({
      method: 'GET',
      url: '/api/events?published=true',
    });

    const body = JSON.parse(response.body);
    expect(body.data.events).toHaveLength(2);
  });

  it('deve buscar por título', async () => {
    await createTestEvent({ title: 'CCXP Luanda' });
    await createTestEvent({ title: 'Anime Fest' });
    await createTestEvent({ title: 'CCXP Benguela' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/events?search=CCXP',
    });

    const body = JSON.parse(response.body);
    expect(body.data.events).toHaveLength(2);
  });

  it('deve retornar lista vazia quando não há eventos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/events',
    });

    const body = JSON.parse(response.body);
    expect(body.data.events).toHaveLength(0);
    expect(body.data.total).toBe(0);
  });
});