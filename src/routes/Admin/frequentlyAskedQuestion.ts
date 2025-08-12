import { FastifyInstance } from 'fastify';
import FrequentlyAskedQuestionController from '../../controllers/Admin/FrequentlyAskedQuestionController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { frequentlyAskedQuestionSchema, frequentlyAskedQuestionUpdateSchema } from '../../validators/Admin/frequentlyAskedQuestion';
import { validate } from '../../middlewares/validate';

export default async function frequentlyAskedQuestionRoutes(fastify: FastifyInstance) {
    const controller = new FrequentlyAskedQuestionController()
    fastify.get('/', controller.findAll);
    fastify.get('/datatable', { onRequest: [authAdminMiddleware] }, controller.dataTables);
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(frequentlyAskedQuestionSchema)], handler: controller.create });
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(frequentlyAskedQuestionUpdateSchema)], handler: controller.update });

    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete });
}

