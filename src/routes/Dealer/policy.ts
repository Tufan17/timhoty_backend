import { FastifyInstance } from 'fastify';
import PolicyController from '../../controllers/Dealer/PolicyController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new PolicyController()
    fastify.get('/', { onRequest: [authDealerMiddleware],handler: controller.dataTable });
    fastify.get('/:id', { onRequest: [authDealerMiddleware],handler: controller.getPolicyById });
    fastify.post('/', { onRequest: [authDealerMiddleware],handler: controller.create });
    fastify.put('/:id', { onRequest: [authDealerMiddleware],handler: controller.update });
    fastify.delete('/:id', { onRequest: [authDealerMiddleware],handler: controller.delete });
}
