import { FastifyInstance } from 'fastify';
import UserController from '../../controllers/User/UserController';
import { authUserMiddleware } from '../../middlewares/authUserMiddleware'
import { validate } from '../../middlewares/validate';
import { userCustomerUpdateSchema } from '../../validators/User/userCustomer';

export default async function CustomerUserRoutes(fastify: FastifyInstance) {
    const controller = new UserController()
    fastify.get('/:id', { onRequest: [authUserMiddleware], handler: controller.findOne});
    fastify.put('/:id', { onRequest: [authUserMiddleware], preValidation: [validate(userCustomerUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authUserMiddleware], handler: controller.delete});
}

