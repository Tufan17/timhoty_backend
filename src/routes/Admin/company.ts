import { FastifyInstance } from 'fastify';
import CompanyController from '../../controllers/Admin/CompanyController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function jobRoutes(fastify: FastifyInstance) {
    const controller = new CompanyController()
    fastify.get('/', controller.findAll);
    fastify.get('/list', controller.findAllList);
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne });
    fastify.post('/', { onRequest: [authAdminMiddleware], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], handler: controller.update });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

