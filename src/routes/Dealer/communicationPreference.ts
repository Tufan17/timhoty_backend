import { FastifyInstance } from 'fastify';
import CommunicationPreferenceController from '../../controllers/Dealer/CommunicationPreferenceController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'
import { communicationPreferenceSchema } from '../../validators/Admin/communicationPreference';
import { validate } from '../../middlewares/validate';

export default async function communicationPreferenceRoutes(fastify: FastifyInstance) {
    const controller = new CommunicationPreferenceController()
    fastify.get('/', { onRequest: [authDealerMiddleware], handler: controller.findAll });
    fastify.get('/:id', { onRequest: [authDealerMiddleware], handler: controller.findOne });
    fastify.post('/', { onRequest: [authDealerMiddleware], preValidation: [validate(communicationPreferenceSchema)], handler: controller.createOrUpdate });
}

