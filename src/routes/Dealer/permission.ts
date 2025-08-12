import { FastifyInstance } from 'fastify';
import PermissionController from '../../controllers/Dealer/PermissionController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'
import { permissionSchema, dealerPermissionTotalSchema } from '../../validators/Admin/permission';
import { validate } from '../../middlewares/validate';

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new PermissionController()
    fastify.get('/:target/:id', { onRequest: [authDealerMiddleware], handler: controller.findUser });
    fastify.post('/', { onRequest: [authDealerMiddleware], preValidation: [validate(permissionSchema)], handler: controller.createOrUpdate });
    fastify.post('/total', { onRequest: [authDealerMiddleware], preValidation: [validate(dealerPermissionTotalSchema)], handler: controller.totalCreateOrUpdate });
}
