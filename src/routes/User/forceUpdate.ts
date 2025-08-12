import { FastifyInstance } from 'fastify';
import ForceUpdateController from '../../controllers/User/ForceUpdateController';
import { authUserMiddleware } from '../../middlewares/authUserMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new ForceUpdateController()
    fastify.post('/', { onRequest: [authUserMiddleware], handler: controller.create });
}
