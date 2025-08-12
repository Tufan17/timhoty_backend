import { FastifyInstance } from 'fastify';
import LandingController from '../../controllers/Admin/LandingController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';

export default async function landingRoutes(fastify: FastifyInstance) {
    const controller = new LandingController()
    fastify.get('/', controller.findAll);
    fastify.post('/', { onRequest: [authAdminMiddleware], handler: controller.create });
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], handler: controller.update });
}

