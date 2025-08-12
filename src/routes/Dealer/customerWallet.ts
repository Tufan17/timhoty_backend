import { FastifyInstance } from 'fastify';
import CustomerWalletController from '../../controllers/Dealer/CustomerWalletController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'

export default async function UserWalletRoutes(fastify: FastifyInstance) {
    const controller = new CustomerWalletController()
    fastify.get('/:id', { onRequest: [authDealerMiddleware], handler: controller.dataTable});
}

