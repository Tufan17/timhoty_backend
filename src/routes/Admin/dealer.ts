import { FastifyInstance } from 'fastify';
import DealerController from '../../controllers/Admin/DealerController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'
import { dealerSchema, dealerUpdateSchema } from '../../validators/Admin/dealer';
import { validate } from '../../middlewares/validate';

export default async function dealerRoutes(fastify: FastifyInstance) {
    const controller = new DealerController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll});
    fastify.get('/list', { onRequest: [authAdminMiddleware], handler: controller.getDealerList});
    fastify.get('/info', { onRequest: [authDealerMiddleware], handler: controller.getDealerInfo});
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne});
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerSchema)], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerUpdateSchema)], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

