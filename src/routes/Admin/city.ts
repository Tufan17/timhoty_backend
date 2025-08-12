import { FastifyInstance } from 'fastify';
import CityController from '../../controllers/Admin/CityController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { citySchema, cityUpdateSchema } from '../../validators/Admin/city';
import { validate } from '../../middlewares/validate';

export default async function cityRoutes(fastify: FastifyInstance) {
    const controller = new CityController()
    fastify.get('/', controller.findAll);
    fastify.get('/datatable',{ onRequest: [authAdminMiddleware] }, controller.dataTable);
    fastify.get('/:id', controller.findOne);
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(citySchema)], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(cityUpdateSchema)], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

