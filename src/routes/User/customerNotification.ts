import { FastifyInstance } from 'fastify';
import CustomerNotificationController from '../../controllers/User/CustomerNotificationController';
import { authUserMiddleware } from '../../middlewares/authUserMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new CustomerNotificationController()
    fastify.get('/new-count', { onRequest: [authUserMiddleware], handler: controller.newCount });
    fastify.get('/datatable', { onRequest: [authUserMiddleware], handler: controller.datatable });
    fastify.post('/read/:id', { onRequest: [authUserMiddleware], handler: controller.read });
}
