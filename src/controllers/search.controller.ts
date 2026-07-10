import { FastifyRequest, FastifyReply } from 'fastify';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export class SearchController {
  async search(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { q } = request.query as { q?: string };

      if (!q || q.trim().length < 2) {
        return reply.status(400).send({
          success: false,
          message: 'O parâmetro "q" deve ter pelo menos 2 caracteres',
        });
      }

      const results = await searchService.search(q);

      return reply.status(200).send({
        success: true,
        data: results,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Erro ao realizar pesquisa',
      });
    }
  }
}
