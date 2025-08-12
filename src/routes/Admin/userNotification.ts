import { FastifyInstance } from 'fastify';
import UserNotificationController from '../../controllers/Admin/UserNotificationController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';
import { userNotificationSchema } from '../../validators/Admin/userNotification';

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new UserNotificationController()
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(userNotificationSchema)], handler: controller.create });
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll });
    fastify.get('/datatable', { onRequest: [authAdminMiddleware], handler: controller.datatable });
    fastify.post('/read/:id', { onRequest: [authAdminMiddleware], handler: controller.read });
}
