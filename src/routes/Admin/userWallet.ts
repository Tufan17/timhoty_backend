import { FastifyInstance } from 'fastify';
import UserWalletController from '../../controllers/Admin/UserWalletController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function UserWalletRoutes(fastify: FastifyInstance) {
    const controller = new UserWalletController()
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.dataTable});
}

