import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.helper';
import { createTestUser, loginAndGetToken } from '../helpers/auth.helper';

describe('POST /api/events', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeEach(async () => {
    app = await createTestApp();

    // Criar admin e obter token
    await createTestUser({
      email: 'admin@test.com',
      password: '123456',
      role: 'ADMIN',
    });
    adminToken = await loginAndGetToken(app, 'admin@test.com', '123456');
  });

  it('deve criar evento com sucesso (ADMIN)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        title: 'CCXP Luanda 2024',
        description: 'A maior convenção de cultura pop de Angola',
        date: '2024-12-15T10:00:00Z',
        location: 'Centro de Convenções de Luanda',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.title).toBe('CCXP Luanda 2024');
    expect(body.data.slug).toBe('ccxp-luanda-2024');
    expect(body.data.published).toBe(false);
  });

  it('deve rejeitar quando não autenticado', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/events',
      payload: {
        title: 'Evento Teste',
        date: '2024-12-15T10:00:00Z',
        location: 'Luanda',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('deve rejeitar quando user não é ADMIN', async () => {
    // Criar user normal
    await createTestUser({
      email: 'user@test.com',
      password: '123456',
      role: 'USER',
    });
    const userToken = await loginAndGetToken(app, 'user@test.com', '123456');

    const response = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        title: 'Evento Teste',
        date: '2024-12-15T10:00:00Z',
        location: 'Luanda',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('deve rejeitar título duplicado', async () => {
    // Criar primeiro evento
    await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        title: 'Evento Duplicado',
        date: '2024-12-15T10:00:00Z',
        location: 'Luanda',
      },
    });

    // Tentar criar outro com mesmo título
    const response = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        title: 'Evento Duplicado',
        date: '2024-12-16T10:00:00Z',
        location: 'Benguela',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('Já existe um evento com este título');
  });

  it('deve rejeitar dados inválidos', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        title: 'AB', // muito curto
        date: 'data-invalida',
        location: 'LU', // muito curto
      },
    });

    expect(response.statusCode).toBe(400);
  });
});