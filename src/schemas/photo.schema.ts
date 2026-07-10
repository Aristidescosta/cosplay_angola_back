import { z } from 'zod';

/**
 * Schema de validação para upload de foto
 */
export const uploadPhotoSchema = z.object({
  galleryId: z.string().uuid('ID de galeria inválido'),
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schema de validação para atualizar foto
 */
export const updatePhotoSchema = z.object({
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

/**
 * Schema para publicar/despublicar
 */
export const publishPhotoSchema = z.object({
  published: z.boolean(),
});

/**
 * Schema para reordenar fotos
 */
export const reorderPhotosSchema = z.object({
  photoIds: z.array(z.string().uuid()),
});

// Tipos TypeScript
export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
export type PublishPhotoInput = z.infer<typeof publishPhotoSchema>;
export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>;