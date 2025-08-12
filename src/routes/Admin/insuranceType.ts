import { FastifyInstance } from 'fastify';
import InsuranceTypeController from '../../controllers/Admin/InsuranceTypeController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';
import { insuranceTypeSchema, insuranceTypeUpdateSchema } from '../../validators/Admin/insuranceType';

export default async function insuranceTypeRoutes(fastify: FastifyInstance) {
    const controller = new InsuranceTypeController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll});
    fastify.get('/list', { handler: controller.getCategoryList});
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne});
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(insuranceTypeSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(insuranceTypeUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete});

}

