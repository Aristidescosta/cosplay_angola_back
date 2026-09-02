import z from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido'),
  message: z
    .string()
    .trim()
    .min(10, 'Mensagem deve ter pelo menos 10 caracteres')
    .max(2000, 'Mensagem deve ter no máximo 2000 caracteres'),
});

export type ContactInput = z.infer<typeof contactSchema>;
