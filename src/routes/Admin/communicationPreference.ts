import { FastifyInstance } from 'fastify';
import CommunicationPreferenceController from '../../controllers/Admin/CommunicationPreferenceController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { communicationPreferenceSchema } from '../../validators/Admin/communicationPreference';
import { validate } from '../../middlewares/validate';

export default async function communicationPreferenceRoutes(fastify: FastifyInstance) {
    const controller = new CommunicationPreferenceController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll });
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne });
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(communicationPreferenceSchema)], handler: controller.createOrUpdate });
}

