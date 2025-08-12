import { FastifyInstance } from 'fastify';
import UserNotificationController from '../../controllers/Dealer/UserNotificationController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new UserNotificationController()
    fastify.get('/', { onRequest: [authDealerMiddleware], handler: controller.findAll });
    fastify.get('/datatable', { onRequest: [authDealerMiddleware], handler: controller.datatable });
    fastify.post('/read/:id', { onRequest: [authDealerMiddleware], handler: controller.read });
}
