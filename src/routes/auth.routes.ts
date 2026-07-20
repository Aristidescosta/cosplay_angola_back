import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Registo público de novo utilizador (cria sempre role USER)
   */
  app.post('/register', authController.register);

  /**
   * POST /api/auth/users
   * Criação de utilizador com role à escolha (USER/PHOTOGRAPHER/ADMIN)
   * (Rota protegida - requer autenticação de ADMIN)
   */
  app.post('/users', {
    preHandler: [authMiddleware, requireRole('ADMIN')],
    handler: authController.createUser,
  });

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