import { FastifyInstance } from 'fastify';
import DealerWalletController from '../../controllers/Admin/DealerWalletController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function DealerWalletRoutes(fastify: FastifyInstance) {
    const controller = new DealerWalletController()
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.dataTable});
}

