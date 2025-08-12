import { FastifyInstance } from 'fastify';
import DistrictController from '../../controllers/Admin/DistrictController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { districtSchema, districtUpdateSchema } from '../../validators/Admin/city';
import { validate } from '../../middlewares/validate';

export default async function cityRoutes(fastify: FastifyInstance) {
    const controller = new DistrictController()
    fastify.get('/:id', controller.findAll);
    fastify.get('/datatable', { onRequest: [] }, controller.dataTable);
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(districtSchema)], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(districtUpdateSchema)], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

