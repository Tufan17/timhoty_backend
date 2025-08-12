import { FastifyInstance } from 'fastify';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware';
import OperationController from '@/controllers/Admin/OperationController';
import { validate } from '../../middlewares/validate';
import { operationSchema } from '../../validators/Admin/operation';

export default async function operationRoutes(fastify: FastifyInstance) {
    const controller = new OperationController();
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(operationSchema)], handler: controller.create });
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.dataTable });
}   