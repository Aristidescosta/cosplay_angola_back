import { FastifyInstance } from "fastify";
import { TagController } from "../controllers/tag.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const tagController = new TagController();

export function tagRoutes(app: FastifyInstance) {

    app.get('/', tagController.list);
    app.get('/:slug', tagController.getBySlug);

    app.post('/', tagController.create);
    app.put('/:id', { preHandler: [authMiddleware, requireRole('ADMIN')] }, tagController.update);
    app.delete('/:id', { preHandler: [authMiddleware, requireRole('ADMIN')] }, tagController.delete);
}
