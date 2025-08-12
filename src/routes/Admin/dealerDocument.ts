import { FastifyInstance } from 'fastify';
import DealerDocumentController from '../../controllers/Admin/DealerDocumentController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function dealerDocumentRoutes(fastify: FastifyInstance) {
    const controller = new DealerDocumentController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll });
    fastify.get('/dealer/:id', { onRequest: [authAdminMiddleware], handler: controller.findByDealerId });
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findById });
    fastify.post('/', { onRequest: [authAdminMiddleware], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

