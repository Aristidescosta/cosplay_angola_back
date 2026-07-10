import { z } from 'zod';

/**
 * Schema de validação para criar galeria
 */
export const createGallerySchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().max(20000).optional(),
});

/**
 * Schema de validação para atualizar galeria
 */
export const updateGallerySchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().max(20000).optional(),
  coverPhotoId: z.string().uuid().optional(),
  showcaseVideoUrl: z.string().optional(),
  published: z.boolean().optional(),
});

/**
 * Schema para publicar/despublicar
 */
export const publishGallerySchema = z.object({
  published: z.boolean(),
});

// Tipos TypeScript
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
export type PublishGalleryInput = z.infer<typeof publishGallerySchema>;