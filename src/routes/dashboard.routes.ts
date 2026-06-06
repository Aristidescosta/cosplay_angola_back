import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const dashboardController = new DashboardController();

export async function dashboardRoutes(app: FastifyInstance) {
  /**
   * GET /api/dashboard
   * Resumo do dashboard (só ADMIN)
   */
  app.get('/', {
    preHandler: [authMiddleware, requireRole('ADMIN')],
    handler: dashboardController.getSummary,
  });
}
