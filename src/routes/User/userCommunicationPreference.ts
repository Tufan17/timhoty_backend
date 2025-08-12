import { FastifyInstance } from 'fastify';
import UserCommunicationPreferenceController from '../../controllers/User/UserCommunicationPreferenceController';
import { authUserMiddleware } from '../../middlewares/authUserMiddleware'
import { communicationPreferenceSchema } from '../../validators/User/userCommunicationPreference';
import { validate } from '../../middlewares/validate';

export default async function communicationPreferenceRoutes(fastify: FastifyInstance) {
    const controller = new UserCommunicationPreferenceController()
    fastify.get('/', { onRequest: [authUserMiddleware], handler: controller.findOne });
    fastify.post('/', { onRequest: [authUserMiddleware], preValidation: [validate(communicationPreferenceSchema)], handler: controller.createOrUpdate });
}

