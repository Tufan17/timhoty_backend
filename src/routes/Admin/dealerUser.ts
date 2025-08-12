import { FastifyInstance } from 'fastify';
import DealerUserController from '../../controllers/Admin/DealerUserController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';
import { dealerUserSchema, dealerUserUpdateSchema, dealerUserVerifySchema, dealerUserResendOtpSchema } from '../../validators/Admin/dealer_user';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware';

export default async function dealerUserRoutes(fastify: FastifyInstance) {
    const controller = new DealerUserController()
    fastify.get('/', { onRequest: [authAdminMiddleware], handler: controller.findAll});
    fastify.get('/user', { onRequest: [authDealerMiddleware], handler: controller.getUser});
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.dealerUser});
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerUserSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerUserUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete});
    fastify.post('/verify', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerUserVerifySchema)], handler: controller.verify});
    fastify.post('/resend-otp', { onRequest: [authAdminMiddleware], preValidation: [validate(dealerUserResendOtpSchema)], handler: controller.resendOtp});

}

