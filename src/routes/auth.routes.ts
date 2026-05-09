import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Registo de novo utilizador
   */
  app.post('/register', authController.register);

  /**
   * POST /api/auth/login
   * Login de utilizador
   */
  app.post('/login', authController.login);

  /**
   * GET /api/auth/me
   * Obter dados do utilizador autenticado
   * (Rota protegida - requer autenticação)
   */
  app.get('/me', {
    preHandler: authMiddleware,
    handler: authController.me,
  });
}