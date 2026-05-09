import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.helper';
import { createTestUser, loginAndGetToken } from '../helpers/auth.helper';
import { createTestEvent } from '../helpers/event.helper';

describe('POST /api/galleries', () => {
  let app: FastifyInstance;
  let photographerToken: string;
  let photographerId: string;
  let eventId: string;

  beforeEach(async () => {
    app = await createTestApp();

    // Criar photographer
    const photographer = await createTestUser({
      email: 'photo@test.com',
      password: '123456',
      role: 'PHOTOGRAPHER',
    });
    photographerId = photographer.id;
    photographerToken = await loginAndGetToken(app, 'photo@test.com', '123456');

    // Criar evento
    const event = await createTestEvent();
    eventId = event.id;
  });

  it('deve criar galeria com sucesso (PHOTOGRAPHER)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/galleries',
      headers: {
        authorization: `Bearer ${photographerToken}`,
      },
      payload: {
        eventId,
        title: 'Dia 1 - Manhã',
        description: 'Fotos do primeiro dia pela manhã',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.title).toBe('Dia 1 - Manhã');
    expect(body.data.eventId).toBe(eventId);
    expect(body.data.photographerId).toBe(photographerId);
    expect(body.data.published).toBe(false);
  });

  it('deve criar galeria com sucesso (ADMIN)', async () => {
    const admin = await createTestUser({
      email: 'admin@test.com',
      password: '123456',
      role: 'ADMIN',
    });
    const adminToken = await loginAndGetToken(app, 'admin@test.com', '123456');

    const response = await app.inject({
      method: 'POST',
      url: '/api/galleries',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        eventId,
        title: 'Galeria Admin',
      },
    });

    expect(response.statusCode).toBe(201);
  });

  it('deve rejeitar quando não autenticado', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/galleries',
      payload: {
        eventId,
        title: 'Galeria Teste',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('deve rejeitar quando user não é PHOTOGRAPHER nem ADMIN', async () => {
    const user = await createTestUser({
      email: 'user@test.com',
      password: '123456',
      role: 'USER',
    });
    const userToken = await loginAndGetToken(app, 'user@test.com', '123456');

    const response = await app.inject({
      method: 'POST',
      url: '/api/galleries',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        eventId,
        title: 'Galeria Teste',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('deve rejeitar quando evento não existe', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/galleries',
      headers: {
        authorization: `Bearer ${photographerToken}`,
      },
      payload: {
        eventId: '00000000-0000-0000-0000-000000000000',
        title: 'Galeria Teste',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('não encontrado');
  });

  it('deve rejeitar dados inválidos', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/galleries',
      headers: {
        authorization: `Bearer ${photographerToken}`,
      },
      payload: {
        eventId: 'id-invalido',
        title: 'AB', // muito curto
      },
    });

    expect(response.statusCode).toBe(400);
  });
});