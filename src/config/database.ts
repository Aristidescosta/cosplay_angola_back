import { PrismaClient } from '@prisma/client';

// Singleton do Prisma Client
// Isto garante que só existe uma conexão à base de dados

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };