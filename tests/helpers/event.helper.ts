import { prisma } from '../../src/config/database';

/**
 * Cria um evento de teste diretamente na BD
 */
export async function createTestEvent(data?: {
  title?: string;
  description?: string;
  date?: Date;
  location?: string;
  published?: boolean;
}) {
  const title = data?.title || `Evento Teste ${Date.now()}`;
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  return prisma.event.create({
    data: {
      title,
      slug,
      description: data?.description || 'Descrição do evento de teste',
      date: data?.date || new Date('2024-12-31'),
      location: data?.location || 'Luanda, Angola',
      published: data?.published ?? false,
    },
  });
}