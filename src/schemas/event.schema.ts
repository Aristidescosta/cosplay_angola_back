import { z } from 'zod';

/**
 * Schema de validação para criar evento
 */
export const createEventSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  date: z.string().datetime('Data inválida (use formato ISO 8601)'),
  location: z.string().min(3, 'Localização deve ter no mínimo 3 caracteres'),
  coverImageUrl: z.string().url('URL de imagem inválida').optional(),
  showcaseVideoUrl: z.string().optional(),
});

/**
 * Schema de validação para atualizar evento
 * Todos os campos são opcionais
 */
export const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  location: z.string().min(3).optional(),
  coverImageUrl: z.string().url().optional(),
  showcaseVideoUrl: z.string().optional(),
  published: z.boolean().optional(),
});

/**
 * Schema para publicar/despublicar
 */
export const publishEventSchema = z.object({
  published: z.boolean(),
});

// Tipos TypeScript
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type PublishEventInput = z.infer<typeof publishEventSchema>;