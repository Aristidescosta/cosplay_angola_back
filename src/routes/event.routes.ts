import { FastifyInstance } from 'fastify';
import { EventController } from '../controllers/event.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const eventController = new EventController();

export async function eventRoutes(app: FastifyInstance) {
  /**
   * GET /api/events
   * Listar eventos (público)
   */
  app.get('/', eventController.list);

  /**
   * GET /api/events/:id
   * Ver detalhes de evento (público)
   */
  app.get('/:id', eventController.getById);

  /**
   * GET /api/events/slug/:slug
   * Ver evento por slug (público)
   */
  app.get('/slug/:slug', eventController.getBySlug);

  /**
   * POST /api/events
   * Criar evento (só ADMIN)
   */
  app.post('/', {
    preHandler: [authMiddleware, requireRole('ADMIN')],
    handler: eventController.create,
  });

  /**
   * PUT /api/events/:id
   * Atualizar evento (só ADMIN)
   */
  app.put('/:id', {
    preHandler: [authMiddleware, requireRole('ADMIN')],
    handler: eventController.update,
  });

  /**
   * PATCH /api/events/:id/publish
   * Publicar/despublicar (só ADMIN)
   */
  app.patch('/:id/publish', {
    preHandler: [authMiddleware, requireRole('ADMIN')],
    handler: eventController.publish,
  });

  /**
   * DELETE /api/events/:id
   * Apagar evento (só ADMIN)
   */
  app.delete('/:id', {
    preHandler: [authMiddleware, requireRole('ADMIN')],
    handler: eventController.delete,
  });
}