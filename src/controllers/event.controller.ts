import { FastifyRequest, FastifyReply } from 'fastify';
import { EventService } from '../services/event.service';
import {
  createEventSchema,
  updateEventSchema,
  publishEventSchema,
} from '../schemas/event.schema';

const eventService = new EventService();

export class EventController {
  /**
   * POST /api/events
   * Criar novo evento
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createEventSchema.parse(request.body);
      const event = await eventService.create(data);

      return reply.status(201).send({
        success: true,
        message: 'Evento criado com sucesso',
        data: event,
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
        message: error.message || 'Erro ao criar evento',
      });
    }
  }

  /**
   * GET /api/events
   * Listar eventos com filtros
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const filters = {
        published: query.published === 'true' ? true : query.published === 'false' ? false : undefined,
        search: query.search,
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      };

      const result = await eventService.list(filters);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao listar eventos',
      });
    }
  }

  /**
   * GET /api/events/:id
   * Ver detalhes de evento
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const event = await eventService.getById(id);

      return reply.status(200).send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Evento não encontrado',
      });
    }
  }

  /**
   * GET /api/events/slug/:slug
   * Ver evento por slug
   */
  async getBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const event = await eventService.getBySlug(slug);

      return reply.status(200).send({
        success: true,
        data: event,
      });
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Evento não encontrado',
      });
    }
  }

  /**
   * PUT /api/events/:id
   * Atualizar evento
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateEventSchema.parse(request.body);

      const event = await eventService.update(id, data);

      return reply.status(200).send({
        success: true,
        message: 'Evento atualizado com sucesso',
        data: event,
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
        message: error.message || 'Erro ao atualizar evento',
      });
    }
  }

  /**
   * PATCH /api/events/:id/publish
   * Publicar/despublicar evento
   */
  async publish(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = publishEventSchema.parse(request.body);

      const event = await eventService.publish(id, data);

      return reply.status(200).send({
        success: true,
        message: `Evento ${data.published ? 'publicado' : 'despublicado'} com sucesso`,
        data: event,
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
        message: error.message || 'Erro ao publicar evento',
      });
    }
  }

  /**
   * POST /api/events/:id/cover
   * Upload de imagem de capa
   */
  async uploadCover(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          message: 'Nenhum ficheiro enviado',
        });
      }

      const buffer = await data.toBuffer();
      const event = await eventService.uploadCover(id, {
        buffer,
        filename: data.filename,
        mimetype: data.mimetype,
      });

      return reply.status(200).send({
        success: true,
        message: 'Imagem de capa atualizada com sucesso',
        data: event,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao fazer upload da capa',
      });
    }
  }

  /**
   * DELETE /api/events/:id
   * Apagar evento
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await eventService.delete(id);

      return reply.status(200).send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao apagar evento',
      });
    }
  }
}