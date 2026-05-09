import { beforeAll, afterAll, beforeEach } from "vitest";
import { execSync } from "child_process";
import { prisma } from "../src/config/database";

// Executar antes de TODOS os testes
beforeAll(async () => {
  // Garante que estamos a usar a BD de teste
  if (!process.env.DATABASE_URL?.includes("test")) {
    throw new Error("ATENÇÃO: Não estás a usar a base de dados de TESTE!");
  }

  // Criar a base de dados de teste se não existir
  try {
    execSync("npx prisma db push", {
      env: { ...process.env },
    });
    console.log("✅ Base de dados de teste pronta");
  } catch (error) {
    console.error("❌ Erro ao criar BD de teste:", error);
  }
});

// Executar antes de CADA teste
beforeEach(async () => {
  await prisma.photographer.deleteMany();
  await prisma.user.deleteMany();
});

// Executar depois de TODOS os testes
afterAll(async () => {
  // Fechar conexão com BD
  await prisma.$disconnect();
});
