import { FastifyInstance } from 'fastify';
import PermissionController from '../../controllers/Admin/PermissionController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { permissionSchema, permissionTotalSchema } from '../../validators/Admin/permission';
import { validate } from '../../middlewares/validate';

export default async function permissionRoutes(fastify: FastifyInstance) {
    const controller = new PermissionController()
    fastify.get('/:target/:id', { onRequest: [authAdminMiddleware], handler: controller.findUser });
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(permissionSchema)], handler: controller.createOrUpdate });
    fastify.post('/total', { onRequest: [authAdminMiddleware], preValidation: [validate(permissionTotalSchema)], handler: controller.totalCreateOrUpdate });
}
