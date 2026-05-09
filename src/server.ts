import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./config/env";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";
import { galleryRoutes } from "./routes/gallery.routes";
import { photoRoutes } from "./routes/photo.routes";

const app = Fastify({
  logger: {
    level: config.nodeEnv === "development" ? "info" : "error",
    transport:
      config.nodeEnv === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
});

// Registar plugins
async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin: true,
  });

  // Multipart - para upload de ficheiros
  await app.register(multipart, {
    limits: {
      fileSize: config.maxFileSize,
    },
  });
}

async function registerRoutes() {
  // Health check route (para testar se o servidor está a funcionar)
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Auth routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(eventRoutes, { prefix: "/api/events" });
  await app.register(galleryRoutes, { prefix: "/api/galleries" });
  await app.register(photoRoutes, { prefix: '/api/photos' });
  // Outras rotas virão aqui
  // await app.register(eventRoutes, { prefix: '/api/events' });
}

// Iniciar servidor
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await app.listen({
      port: config.port,
      host: "0.0.0.0",
    });

    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📚 Environment: ${config.nodeEnv}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
