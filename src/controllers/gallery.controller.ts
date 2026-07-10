import { FastifyRequest, FastifyReply } from 'fastify';
import { GalleryService } from '../services/gallery.service';
import {
  createGallerySchema,
  updateGallerySchema,
  publishGallerySchema,
} from '../schemas/gallery.schema';

const galleryService = new GalleryService();

export class GalleryController {
  /**
   * POST /api/galleries
   * Criar nova galeria
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createGallerySchema.parse(request.body);
      // @ts-ignore
      const userId = request.user.userId;

      const gallery = await galleryService.create(data, userId);

      return reply.status(201).send({
        success: true,
        message: 'Galeria criada com sucesso',
        data: gallery,
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
        message: error.message || 'Erro ao criar galeria',
      });
    }
  }

  /**
   * GET /api/galleries
   * Listar galerias
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const filters = {
        eventId: query.eventId,
        photographerId: query.photographerId,
        published: query.published === 'true' ? true : query.published === 'false' ? false : undefined,
        search: query.search,
        tag: query.tag,
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      };

      const result = await galleryService.list(filters);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao listar galerias',
      });
    }
  }

  /**
   * GET /api/galleries/:id
   * Ver detalhes de galeria
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      // @ts-ignore
      const userId = request.user?.userId;
      // @ts-ignore
      const userRole = request.user?.role;
      const gallery = await galleryService.getById(id, userId, userRole);

      return reply.status(200).send({
        success: true,
        data: gallery,
      });
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Galeria não encontrada',
      });
    }
  }

  /**
   * GET /api/events/:eventId/galleries
   * Galerias de um evento específico
   */
  async getByEventId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { eventId } = request.params as { eventId: string };
      const query = request.query as any;
      
      // Se user está autenticado como ADMIN, pode ver não publicadas
      // @ts-ignore
      const userRole = request.user?.role;
      const includeUnpublished = userRole === 'ADMIN';

      const galleries = await galleryService.getByEventId(eventId, includeUnpublished, query.search);

      return reply.status(200).send({
        success: true,
        data: galleries,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao buscar galerias',
      });
    }
  }

  /**
   * PUT /api/galleries/:id
   * Atualizar galeria
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateGallerySchema.parse(request.body);
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      const gallery = await galleryService.update(id, data, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: 'Galeria atualizada com sucesso',
        data: gallery,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao atualizar galeria',
      });
    }
  }

  /**
   * PATCH /api/galleries/:id/publish
   * Publicar/despublicar galeria
   */
  async publish(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = publishGallerySchema.parse(request.body);
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      const gallery = await galleryService.publish(id, data, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: `Galeria ${data.published ? 'publicada' : 'despublicada'} com sucesso`,
        data: gallery,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        });
      }

      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao publicar galeria',
      });
    }
  }

  /**
   * DELETE /api/galleries/:id
   * Apagar galeria
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      const result = await galleryService.delete(id, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao apagar galeria',
      });
    }
  }
}