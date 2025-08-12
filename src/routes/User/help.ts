import { FastifyInstance } from 'fastify';
import HelpController from '../../controllers/User/HelpController';
import { authUserMiddleware } from '../../middlewares/authUserMiddleware'
import { validate } from '../../middlewares/validate';
import { helpSchema } from '../../validators/User/help';

export default async function feedbackRoutes(fastify: FastifyInstance) {
    const controller = new HelpController()
    fastify.post('/', { onRequest: [authUserMiddleware], preValidation: [validate(helpSchema)], handler: controller.create});

}

