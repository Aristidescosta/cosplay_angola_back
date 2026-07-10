import { FastifyInstance } from 'fastify';
import { PhotoController } from '../controllers/photo.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const photoController = new PhotoController();

export async function photoRoutes(app: FastifyInstance) {
  /**
   * GET /api/photos
   * Listar fotos (público)
   */
  app.get('/', photoController.list);

  /**
   * GET /api/photos/:id
   * Ver detalhes de foto (público)
   */
  app.get('/:id', photoController.getById);

  /**
   * POST /api/photos/upload
   * Upload de foto (PHOTOGRAPHER ou ADMIN)
   */
  app.post('/upload', {
    preHandler: [authMiddleware, requireRole('PHOTOGRAPHER', 'ADMIN')],
    handler: photoController.upload,
  });

  /**
   * POST /api/photos/upload-multiple
   * Upload múltiplo (PHOTOGRAPHER ou ADMIN)
   */
  app.post('/upload-multiple', {
    preHandler: [authMiddleware, requireRole('PHOTOGRAPHER', 'ADMIN')],
    handler: photoController.uploadMultiple,
  });

  /**
   * PUT /api/photos/:id
   * Atualizar foto (dono ou ADMIN)
   */
  app.put('/:id', {
    preHandler: authMiddleware,
    handler: photoController.update,
  });

  /**
   * PATCH /api/photos/:id/publish
   * Publicar/despublicar (dono ou ADMIN)
   */
  app.patch('/:id/publish', {
    preHandler: authMiddleware,
    handler: photoController.publish,
  });

  /**
   * DELETE /api/photos
   * Apagar várias fotos — body: { ids: string[] }
   */
  app.delete('/', {
    preHandler: authMiddleware,
    handler: photoController.deleteMany,
  });

  /**
   * DELETE /api/photos/:id
   * Apagar foto (dono ou ADMIN)
   */
  app.delete('/:id', {
    preHandler: authMiddleware,
    handler: photoController.delete,
  });
}