import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.helper';
import { createTestUser, loginAndGetToken } from '../helpers/auth.helper';

describe('GET /api/auth/me', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('deve retornar dados do utilizador autenticado', async () => {
    // Criar utilizador
    const user = await createTestUser({
      name: 'Me Test',
      email: 'me@test.com',
      password: '123456',
    });

    // Fazer login e obter token
    const token = await loginAndGetToken(app, 'me@test.com', '123456');

    // Chamar /me com token
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(user.id);
    expect(body.data.email).toBe(user.email);
    expect(body.data.name).toBe(user.name);
    expect(body.data).not.toHaveProperty('password');
  });

  it('deve rejeitar quando não há token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Token não fornecido');
  });

  it('deve rejeitar token inválido', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: 'Bearer token-invalido-xyz',
      },
    });

    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it('deve rejeitar formato de authorization incorreto', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: 'SemBearer xyz123',
      },
    });

    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Formato de token inválido');
  });
});