import { z } from 'zod';

/**
 * Schema de validação para registro
 */
export const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter no mínimo 6 caracteres'),
  role: z.enum(['USER', 'PHOTOGRAPHER', 'ADMIN']).optional().default('USER'),
});

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatória'),
});

// Tipos TypeScript gerados a partir dos schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;