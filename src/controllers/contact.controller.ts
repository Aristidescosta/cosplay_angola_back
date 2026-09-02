import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { contactSchema } from '../schemas/contact.schema';
import { ContactService } from '../services/contact.service';
import { isRateLimited } from '../utils/rate-limit';

const contactService = new ContactService();

export class ContactController {
  async send(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (isRateLimited(`contact:${request.ip}`)) {
        return reply.status(429).send({
          success: false,
          message: 'Demasiados pedidos. Tenta novamente mais tarde.',
        });
      }

      const body = request.body as Record<string, unknown>;

      // Honeypot: campo invisível que só bots preenchem
      if (typeof body.website === 'string' && body.website.trim().length > 0) {
        return reply.status(200).send({ success: true });
      }

      const data = contactSchema.parse(body);
      await contactService.sendMessage(data);

      return reply.status(200).send({
        success: true,
        message: 'Mensagem enviada com sucesso',
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          message: error.issues[0]?.message ?? 'Dados inválidos',
          errors: error.issues,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Não foi possível enviar a mensagem. Tenta novamente mais tarde.',
      });
    }
  }
}
