import { authDealerMiddleware } from '@/middlewares/authDealerMiddleware';
import DealerApplicationController from '@/controllers/Dealer/DealerApplicationController';
import { FastifyInstance } from 'fastify';

export default async function DealerApplicationRoutes(fastify: FastifyInstance) {
  const controller = new DealerApplicationController();
  fastify.post('/', { handler: controller.create });
  fastify.get('/', { onRequest: [authDealerMiddleware], handler: controller.findAll });
  fastify.put('/:id', { onRequest: [authDealerMiddleware], handler: controller.update });
  fastify.post('/create-dealer-user', { onRequest: [authDealerMiddleware], handler: controller.createDealerUser });
}
