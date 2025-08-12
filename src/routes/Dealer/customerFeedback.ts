import { FastifyInstance } from 'fastify';
import CustomerFeedbackController from '../../controllers/Dealer/CustomerFeedbackController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'
import { validate } from '../../middlewares/validate';
import { feedbackSchema, feedbackUpdateSchema } from '../../validators/Admin/feedbacks';

export default async function feedbackRoutes(fastify: FastifyInstance) {
    const controller = new CustomerFeedbackController()
    fastify.get('/', { onRequest: [authDealerMiddleware], handler: controller.findAll});
    fastify.get('/:id', { onRequest: [authDealerMiddleware], handler: controller.findOne});
    fastify.post('/', { onRequest: [authDealerMiddleware], preValidation: [validate(feedbackSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authDealerMiddleware], preValidation: [validate(feedbackUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authDealerMiddleware], handler: controller.delete});

}

