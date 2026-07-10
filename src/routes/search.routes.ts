import { FastifyInstance } from 'fastify';
import { SearchController } from '../controllers/search.controller';

const searchController = new SearchController();

export function searchRoutes(app: FastifyInstance) {
  app.get('/', searchController.search);
}
