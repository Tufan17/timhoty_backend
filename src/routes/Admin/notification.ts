import { FastifyInstance } from 'fastify';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware';
import NotificationController from '@/controllers/Admin/NotificationController';

export default async function notificationRoutes(fastify: FastifyInstance) {
    const controller = new NotificationController();
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll });
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findById });
    fastify.post('/', { onRequest: [authAdminMiddleware], handler: controller.create });
}