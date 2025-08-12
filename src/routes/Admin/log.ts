import { FastifyInstance } from 'fastify';
import LogController from '../../controllers/Admin/LogController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware';

export default async function logRoutes(fastify: FastifyInstance) {
    const controller = new LogController();
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll });
}