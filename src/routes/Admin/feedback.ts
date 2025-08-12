import { FastifyInstance } from 'fastify';
import FeedbackController from '../../controllers/Admin/FeedbackController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';
import { feedbackSchema, feedbackUpdateSchema } from '../../validators/Admin/feedbacks';

export default async function feedbackRoutes(fastify: FastifyInstance) {
    const controller = new FeedbackController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll});
    fastify.get('/datatable', { onRequest: [authAdminMiddleware], handler: controller.findAllDataTable});
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne});
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(feedbackSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(feedbackUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete});

}

