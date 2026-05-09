import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtUtils } from '../utils/jwt';

/**
 * Middleware para proteger rotas
 * Verifica se o utilizador está autenticado via JWT
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // 1. Obter token do header Authorization
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        message: 'Token não fornecido',
      });
    }

    // 2. Verificar formato: "Bearer TOKEN"
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return reply.status(401).send({
        success: false,
        message: 'Formato de token inválido',
      });
    }

    // 3. Verificar e descodificar token
    const payload = JwtUtils.verify(token);

    // 4. Adicionar dados do user ao request
    // @ts-ignore
    request.user = payload;

    // 5. Continuar para a próxima função
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: error.message || 'Token inválido',
    });
  }
}

/**
 * Middleware para verificar se user tem role específica
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const userRole = request.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        message: 'Sem permissões para aceder a este recurso',
      });
    }
  };
}