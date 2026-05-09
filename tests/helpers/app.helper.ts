import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { authRoutes } from "../../src/routes/auth.routes";

/**
 * Cria uma instância do Fastify para testes
 * Não inicia o servidor (listen), só configura as rotas
 */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify();

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(multipart);

  // Rotas
  app.get("/health", async () => ({ status: "ok" }));
  await app.register(authRoutes, { prefix: "/api/auth" });

  return app;
}
