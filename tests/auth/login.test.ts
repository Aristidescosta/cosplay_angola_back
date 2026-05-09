import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.helper';
import { createTestUser } from '../helpers/auth.helper';

describe('POST /api/auth/login', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('deve fazer login com credenciais válidas', async () => {
    // Criar utilizador de teste
    const user = await createTestUser({
      email: 'login@test.com',
      password: '123456',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'login@test.com',
        password: '123456',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Login efectuado com sucesso');
    expect(body.data.user.id).toBe(user.id);
    expect(body.data.user.email).toBe(user.email);
    expect(body.data.user).not.toHaveProperty('password');
    expect(body.data).toHaveProperty('token');
  });

  it('deve rejeitar email inexistente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'naoexiste@test.com',
        password: '123456',
      },
    });

    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Credenciais inválidas');
  });

  it('deve rejeitar password incorreta', async () => {
    await createTestUser({
      email: 'wrongpass@test.com',
      password: '123456',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'wrongpass@test.com',
        password: 'senha-errada',
      },
    });

    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Credenciais inválidas');
  });

  it('deve rejeitar email inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'not-an-email',
        password: '123456',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it('deve rejeitar quando falta password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@test.com',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});