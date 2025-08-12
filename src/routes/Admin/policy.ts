import { FastifyInstance } from 'fastify';
import PolicyController from '../../controllers/Admin/PolicyController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new PolicyController()
    fastify.get('/', { onRequest: [authAdminMiddleware],handler: controller.dataTable });
    fastify.post('/', { onRequest: [authAdminMiddleware],handler: controller.create });
}
