import { FastifyReply, FastifyRequest } from "fastify";
import { createTagSchema, updateTagSchema, filterSchema } from "../schemas/TagSchema";
import { TagService } from "../services/tag.service";
import { ZodError } from "zod";

const tagService = new TagService();

export class TagController {
    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = createTagSchema.parse(request.body);
            const tag = await tagService.create(data);
            return reply.status(201).send({
                success: true,
                message: 'Tag criada com sucesso',
                data: tag,
            });
        } catch (error: any) {
            if (error instanceof ZodError) {
                return reply.status(400).send({
                    success: false,
                    message: 'Dados inválidos',
                    errors: error.errors,
                })
            }
            return reply.status(400).send({
                success: false,
                message: error.message || 'Erro ao criar tag',
            });
        }
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const data = updateTagSchema.parse(request.body);
            const tagUpdated = await tagService.update(id, data);
            return reply.status(200).send({
                success: true,
                message: 'Tag atualizada com sucesso',
                data: tagUpdated,
            });
        } catch (error: any) {
            if (error instanceof ZodError) {
                return reply.status(400).send({
                    success: false,
                    message: 'Dados inválidos',
                    errors: error.errors,
                })
            }
            return reply.status(400).send({
                success: false,
                message: error.message || 'Erro ao actualizar tag',
            });
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const result = await tagService.delete(id);
            return reply.status(200).send({
                success: true,
                message: result.message,
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                message: error.message || 'Erro ao apagar tag',
            });
        }
    }

    async getBySlug(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { slug } = request.params as { slug: string };
            const tag = await tagService.getBySlug(slug);
            return reply.status(200).send({
                success: true,
                data: tag,
            });
        } catch (error: any) {
            return reply.status(404).send({
                success: false,
                message: error.message || 'Tag não encontrada',
            });
        }
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = request.query as any;
            const filters = filterSchema.parse({
                search: query.search,
                category: query.category,
                sortBy: query.sortBy,
                limit: query.limit,
                page: query.page
            });
            const tags = await tagService.list(filters);
            return reply.status(200).send({
                success: true,
                data: tags,
            });
        } catch (error: any) {
            if (error instanceof ZodError) {
                return reply.status(400).send({
                    success: false,
                    message: 'Parâmetros inválidos',
                    errors: error.errors,
                })
            }
            return reply.status(400).send({
                success: false,
                message: error.message || 'Erro ao listar tags',
            });
        }
    }
}
