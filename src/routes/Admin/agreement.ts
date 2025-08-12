import { FastifyInstance } from 'fastify';
import AgreementController from '../../controllers/Admin/AgreementController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'

export default async function AgreementRoutes(fastify: FastifyInstance) {
    const controller = new AgreementController()
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.dataTable});
}

