import { FastifyInstance } from 'fastify';
import SupportDealerController from '../../controllers/Dealer/SupportDealerController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new SupportDealerController()
    fastify.post('/', { onRequest: [authDealerMiddleware],handler: controller.create });
    fastify.get('/', { onRequest: [authDealerMiddleware],handler: controller.findAll });
    fastify.get('/:id', { onRequest: [authDealerMiddleware],handler: controller.findById });    
    fastify.put('/message/:id', { onRequest: [authDealerMiddleware],handler: controller.updateMessage });    
}
