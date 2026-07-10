import { FastifyRequest, FastifyReply } from "fastify";
import { JwtUtils } from "../utils/jwt";

/**
 * Middleware para proteger rotas
 * Verifica se o utilizador está autenticado via JWT
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // 1. Obter token do header Authorization
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        message: "Token não fornecido",
      });
    }

    // 2. Verificar formato: "Bearer TOKEN"
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return reply.status(401).send({
        success: false,
        message: "Formato de token inválido",
      });
    }

    const payload = JwtUtils.verify(token);

    // 4. Adicionar dados do user ao request
    // @ts-ignore
    request.user = payload;
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: error.message || "Token inválido",
    });
  }
}

/**
 * Middleware para rotas públicas que precisam saber se o pedido
 * vem de um utilizador autenticado, sem bloquear pedidos anónimos.
 * Nunca rejeita: se não houver token, ou for inválido, o pedido
 * continua sem `request.user`.
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return;

  try {
    // @ts-ignore
    request.user = JwtUtils.verify(token);
  } catch {
    // Token inválido/expirado — segue como pedido anónimo
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
        message: "Sem permissões para aceder a este recurso",
      });
    }
  };
}
