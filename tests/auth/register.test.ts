import { describe, it, expect, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import { createTestApp } from "../helpers/app.helper";
import { createTestUser } from "../helpers/auth.helper";

describe("POST /api/auth/register", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it("deve registar um novo utilizador com sucesso", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Archer Test",
        email: "archer@test.com",
        password: "123456",
      },
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Utilizador registado com sucesso");
    expect(body.data.user).toHaveProperty("id");
    expect(body.data.user).toHaveProperty("email", "archer@test.com");
    expect(body.data.user).toHaveProperty("name", "Archer Test");
    expect(body.data.user).not.toHaveProperty("password"); // não deve retornar password
    expect(body.data).toHaveProperty("token"); // deve retornar JWT token
  });

  it("deve criar utilizador com role USER por padrão", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "User Test",
        email: "user@test.com",
        password: "123456",
      },
    });

    const body = JSON.parse(response.body);
    expect(body.data.user.role).toBe("USER");
  });

  it("deve permitir criar utilizador com role PHOTOGRAPHER", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Photographer Test",
        email: "photo@test.com",
        password: "123456",
        role: "PHOTOGRAPHER",
      },
    });

    const body = JSON.parse(response.body);
    expect(body.data.user.role).toBe("PHOTOGRAPHER");
  });

  it("deve rejeitar email duplicado", async () => {
    // Criar utilizador primeiro
    await createTestUser({ email: "duplicate@test.com" });

    // Tentar criar outro com mesmo email
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Duplicate Test",
        email: "duplicate@test.com",
        password: "123456",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain("já está em uso");
  });

  it("deve rejeitar email inválido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Invalid Email",
        email: "not-an-email",
        password: "123456",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toBe("Dados inválidos");
  });

  it("deve rejeitar password curta (menos de 6 caracteres)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Short Pass",
        email: "short@test.com",
        password: "12345", // só 5 caracteres
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it("deve rejeitar nome curto (menos de 3 caracteres)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Ab", // só 2 caracteres
        email: "shortname@test.com",
        password: "123456",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });
});
