import { FastifyInstance } from 'fastify';
import DealerCommissionController from '../../controllers/Admin/DealerCommission';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { dealerCommissionSchema, dealerCommissionUpdateSchema } from '../../validators/Admin/dealer_commission';
import { validate } from '../../middlewares/validate';

export default async function dealerRoutes(fastify: FastifyInstance) {
    const controller = new DealerCommissionController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll});
    fastify.get('/datatable', { onRequest: [authAdminMiddleware], handler: controller.dataTable});
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne});
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerCommissionSchema)], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerCommissionUpdateSchema)], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

