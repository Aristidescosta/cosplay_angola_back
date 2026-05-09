import { FastifyInstance } from 'fastify';
import { GalleryController } from '../controllers/gallery.controller';
import { PhotoController } from '../controllers/photo.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const galleryController = new GalleryController();
const photoController = new PhotoController();

export async function galleryRoutes(app: FastifyInstance) {
  /**
   * GET /api/galleries
   * Listar galerias (público)
   */
  app.get('/', galleryController.list);

  /**
   * GET /api/galleries/:id
   * Ver detalhes de galeria (público)
   */
  app.get('/:id', galleryController.getById);

  /**
   * POST /api/galleries
   * Criar galeria (PHOTOGRAPHER ou ADMIN)
   */
  app.post('/', {
    preHandler: [authMiddleware, requireRole('PHOTOGRAPHER', 'ADMIN')],
    handler: galleryController.create,
  });

  /**
   * PUT /api/galleries/:id
   * Atualizar galeria (dono ou ADMIN)
   */
  app.put('/:id', {
    preHandler: authMiddleware,
    handler: galleryController.update,
  });

  /**
   * PATCH /api/galleries/:id/publish
   * Publicar/despublicar (dono ou ADMIN)
   */
  app.patch('/:id/publish', {
    preHandler: authMiddleware,
    handler: galleryController.publish,
  });

  /**
   * DELETE /api/galleries/:id
   * Apagar galeria (dono ou ADMIN)
   */
  app.delete('/:id', {
    preHandler: authMiddleware,
    handler: galleryController.delete,
  });

  /**
   * POST /api/galleries/:galleryId/photos/reorder
   * Reordenar fotos de uma galeria (dono ou ADMIN)
   */
  app.post('/:galleryId/photos/reorder', {
    preHandler: authMiddleware,
    handler: photoController.reorder,
  });
}