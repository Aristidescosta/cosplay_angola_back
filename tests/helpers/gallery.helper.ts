import { prisma } from "../../src/config/database";

/**
 * Cria uma galeria de teste diretamente na BD
 */
export async function createTestGallery(data: {
  eventId: string;
  photographerId: string;
  title?: string;
  description?: string;
  published?: boolean;
}) {
  return prisma.gallery.create({
    data: {
      eventId: data.eventId,
      photographerId: data.photographerId,
      title: data.title || `Galeria Teste ${Date.now()}`,
      description: data.description || "Descrição da galeria de teste",
      published: data.published ?? false,
    },
  });
}
