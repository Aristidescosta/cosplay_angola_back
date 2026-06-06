import { FastifyRequest, FastifyReply } from 'fastify';
import { PhotoService } from '../services/photo.service';
import {
  updatePhotoSchema,
  publishPhotoSchema,
  reorderPhotosSchema,
} from '../schemas/photo.schema';

const photoService = new PhotoService();

export class PhotoController {
  /**
   * POST /api/photos/upload
   * Upload de foto(s)
   */
  async upload(request: FastifyRequest, reply: FastifyReply) {
    try {
      // @ts-ignore
      const userId = request.user.userId;

      // Obter dados do multipart
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          message: 'Nenhum ficheiro enviado',
        });
      }

      // Obter galleryId e outros campos dos fields
      const galleryIdField = data.fields.galleryId;
      const captionField = data.fields.caption;
      const tagsField = data.fields.tags;

      const galleryId = galleryIdField && !Array.isArray(galleryIdField) && galleryIdField.type === 'field'
        ? (galleryIdField.value as string)
        : undefined;
      const caption = captionField && !Array.isArray(captionField) && captionField.type === 'field'
        ? (captionField.value as string)
        : undefined;
      const tagsStr = tagsField && !Array.isArray(tagsField) && tagsField.type === 'field'
        ? (tagsField.value as string)
        : undefined;

      let tags: string[] | undefined;
      if (tagsStr) {
        try {
          tags = JSON.parse(tagsStr);
        } catch {
          return reply.status(400).send({ success: false, message: 'Campo tags contém JSON inválido' });
        }
      }

      if (!galleryId) {
        return reply.status(400).send({
          success: false,
          message: 'galleryId é obrigatório',
        });
      }

      const buffer = await data.toBuffer();

      const photo = await photoService.upload(
        { buffer, filename: data.filename, mimetype: data.mimetype },
        galleryId,
        userId,
        caption,
        tags
      );

      return reply.status(201).send({
        success: true,
        message: 'Foto enviada com sucesso',
        data: photo,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao fazer upload da foto',
      });
    }
  }

  /**
   * POST /api/photos/upload-multiple
   * Upload múltiplo de fotos
   */
  async uploadMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      // @ts-ignore
      const userId = request.user.userId;

      // Obter múltiplos ficheiros
      const parts = request.parts();
      const files: { buffer: Buffer; filename: string; mimetype: string }[] = [];
      let galleryId: string | undefined;

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer();
          files.push({ buffer, filename: part.filename, mimetype: part.mimetype });
        } else if (part.fieldname === 'galleryId') {
          galleryId = part.value as string;
        }
      }

      if (!galleryId) {
        return reply.status(400).send({
          success: false,
          message: 'galleryId é obrigatório',
        });
      }

      if (files.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'Nenhum ficheiro enviado',
        });
      }

      const results = await photoService.uploadMultiple(files, galleryId, userId);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      return reply.status(201).send({
        success: true,
        message: `${successCount} foto(s) enviada(s) com sucesso. ${failCount} falharam.`,
        data: results,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao fazer upload das fotos',
      });
    }
  }

  /**
   * GET /api/photos
   * Listar fotos
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      const filters = {
        galleryId: query.galleryId,
        published: query.published === 'true' ? true : query.published === 'false' ? false : undefined,
        tags: query.tags ? query.tags.split(',') : undefined,
        search: query.search,
        limit: query.limit ? parseInt(query.limit) : 50,
        offset: query.offset ? parseInt(query.offset) : 0,
      };

      const result = await photoService.list(filters);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao listar fotos',
      });
    }
  }

  /**
   * GET /api/photos/:id
   * Ver detalhes de foto
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const photo = await photoService.getById(id);

      return reply.status(200).send({
        success: true,
        data: photo,
      });
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Foto não encontrada',
      });
    }
  }

  /**
   * PUT /api/photos/:id
   * Atualizar foto
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updatePhotoSchema.parse(request.body);
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      const photo = await photoService.update(id, data, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: 'Foto atualizada com sucesso',
        data: photo,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao atualizar foto',
      });
    }
  }

  /**
   * PATCH /api/photos/:id/publish
   * Publicar/despublicar foto
   */
  async publish(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = publishPhotoSchema.parse(request.body);
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      const photo = await photoService.publish(id, data, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: `Foto ${data.published ? 'publicada' : 'despublicada'} com sucesso`,
        data: photo,
      });
    } catch (error: any) {
      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao publicar foto',
      });
    }
  }

  /**
   * DELETE /api/photos/:id
   * Apagar foto
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      const result = await photoService.delete(id, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao apagar foto',
      });
    }
  }

  /**
   * DELETE /api/photos
   * Apagar várias fotos
   */
  async deleteMany(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { ids } = request.body as { ids: string[] };
      // @ts-ignore
      const userId = request.user.userId;
      // @ts-ignore
      const userRole = request.user.role;

      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'ids deve ser um array não vazio',
        });
      }

      const result = await photoService.deleteMany(ids, userId, userRole);

      return reply.status(200).send({
        success: true,
        message: `${result.deleted} foto(s) apagada(s) com sucesso`,
        data: result,
      });
    } catch (error: any) {
      const status = error.message.includes('permissões') ? 403 : 400;
      return reply.status(status).send({
        success: false,
        message: error.message || 'Erro ao apagar fotos',
      });
    }
  }

  /**
   * POST /api/galleries/:galleryId/photos/reorder
   * Reordenar fotos
   */
  async reorder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { galleryId } = request.params as { galleryId: string };
      const data = reorderPhotosSchema.parse(request.body);

      const result = await photoService.reorder(galleryId, data.photoIds);

      return reply.status(200).send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao reordenar fotos',
      });
    }
  }
}