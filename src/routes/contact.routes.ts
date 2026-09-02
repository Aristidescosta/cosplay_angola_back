import { FastifyInstance } from 'fastify';
import { ContactController } from '../controllers/contact.controller';

const contactController = new ContactController();

export function contactRoutes(app: FastifyInstance) {
  app.post('/', contactController.send);
}
