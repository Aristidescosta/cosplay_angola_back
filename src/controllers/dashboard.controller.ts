import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await dashboardService.getSummary();

      return reply.status(200).send({
        success: true,
        data,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Erro ao carregar dashboard',
      });
    }
  }
}
