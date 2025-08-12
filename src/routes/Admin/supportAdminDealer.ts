import { FastifyInstance } from 'fastify';
import SupportAdminDealerController from '../../controllers/Admin/SupportAdminDealerController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new SupportAdminDealerController()
    fastify.post('/', { onRequest: [authAdminMiddleware],handler: controller.create });
    fastify.get('/', { onRequest: [authAdminMiddleware],handler: controller.findAll });
    fastify.get('/detail/:id', { onRequest: [authAdminMiddleware],handler: controller.findById });    
    fastify.put('/message/:id', { onRequest: [authAdminMiddleware],handler: controller.updateMessage });    
}
