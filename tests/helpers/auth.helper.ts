import { FastifyInstance } from "fastify";
import { prisma } from "../../src/config/database";
import { PasswordUtils } from "../../src/utils/password";

/**
 * Cria um utilizador de teste diretamente na BD
 */
export async function createTestUser(data?: {
  name?: string;
  email?: string;
  password?: string;
  role?: "USER" | "PHOTOGRAPHER" | "ADMIN";
}) {
  const hashedPassword = await PasswordUtils.hash(data?.password || "123456");

  return prisma.user.create({
    data: {
      name: data?.name || "Test User",
      email: data?.email || `test${Date.now()}@test.com`,
      password: hashedPassword,
      role: data?.role || "USER",
    },
  });
}

/**
 * Faz login e retorna o token
 */
export async function loginAndGetToken(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });

  const body = JSON.parse(response.body);
  return body.data.token;
}
