import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, createUserSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar dados de entrada
      const data = registerSchema.parse(request.body);

      // Chamar service
      const result = await authService.register(data);

      return reply.status(201).send({
        success: true,
        message: 'Utilizador registado com sucesso',
        data: result,
      });
    } catch (error: any) {
      // Erro de validação Zod
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      // Outros erros (ex: email já existe)
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao registar utilizador',
      });
    }
  }

  /**
   * POST /api/auth/users
   * Criação de utilizador por um admin (permite escolher a role)
   */
  async createUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createUserSchema.parse(request.body);

      const result = await authService.createUser(data);

      return reply.status(201).send({
        success: true,
        message: 'Utilizador criado com sucesso',
        data: result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao criar utilizador',
      });
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validar dados de entrada
      const data = loginSchema.parse(request.body);

      // Chamar service
      const result = await authService.login(data);

      return reply.status(200).send({
        success: true,
        message: 'Login efectuado com sucesso',
        data: result,
      });
    } catch (error: any) {
      // Erro de validação Zod
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      // Credenciais inválidas
      return reply.status(401).send({
        success: false,
        message: error.message || 'Credenciais inválidas',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Troca um refresh token válido por um novo par de tokens
   */
  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = refreshTokenSchema.parse(request.body);

      const result = await authService.refresh(data);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      return reply.status(401).send({
        success: false,
        message: error.message || 'Não foi possível renovar a sessão',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Revoga o refresh token (idempotente)
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = refreshTokenSchema.parse(request.body);
      await authService.logout(data.refreshToken);

      return reply.status(200).send({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao terminar sessão',
      });
    }
  }

  /**
   * GET /api/auth/me
   * Retorna dados do utilizador autenticado
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      // @ts-ignore - vamos adicionar isto no middleware
      const userId = request.user.userId;

      const user = await authService.getUserById(userId);

      return reply.status(200).send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Utilizador não encontrado',
      });
    }
  }
}