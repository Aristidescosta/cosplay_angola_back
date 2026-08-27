import { z } from 'zod';

/**
 * Schema de validação para registro público
 * Nota: não aceita `role` — o registo público cria sempre um USER.
 * Contas ADMIN/PHOTOGRAPHER são criadas via POST /api/auth/users (admin-only).
 */
export const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter no mínimo 6 caracteres'),
});

/**
 * Schema de validação para criação de utilizador por um admin
 * (permite escolher a role, ao contrário do registo público)
 */
export const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter no mínimo 6 caracteres'),
  role: z.enum(['USER', 'PHOTOGRAPHER', 'ADMIN']),
});

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatória'),
});

/**
 * Schema de validação para renovar/revogar sessão via refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

/**
 * Schema de validação para criar rapidamente um fotógrafo "de sombra"
 * (sem login próprio) — só o nome, tudo o resto é gerado.
 */
export const quickCreatePhotographerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
});

// Tipos TypeScript gerados a partir dos schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type QuickCreatePhotographerInput = z.infer<typeof quickCreatePhotographerSchema>;