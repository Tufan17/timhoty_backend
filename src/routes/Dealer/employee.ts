import { FastifyInstance } from 'fastify';
import EmployeeController from '../../controllers/Dealer/EmployeeController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware';
import { validate } from '../../middlewares/validate';
import { dealerUserSchema, dealerUserUpdateSchema, dealerUserVerifySchema, dealerUserResendOtpSchema } from '../../validators/Admin/dealer_user';

export default async function dealerUserRoutes(fastify: FastifyInstance) {
    const controller = new EmployeeController()
    fastify.get('/', { onRequest: [authDealerMiddleware], handler: controller.findAll});
    fastify.get('/user', { onRequest: [authDealerMiddleware], handler: controller.getUser});
    fastify.get('/user/:id', { onRequest: [authDealerMiddleware], handler: controller.getEmployee});
    fastify.get('/:id', { onRequest: [authDealerMiddleware], handler: controller.dealerUser});
    fastify.post('/', { onRequest: [authDealerMiddleware], preValidation: [validate(dealerUserSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authDealerMiddleware], preValidation: [validate(dealerUserUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authDealerMiddleware], handler: controller.delete});
    fastify.post('/verify', { onRequest: [authDealerMiddleware], preValidation: [validate(dealerUserVerifySchema)], handler: controller.verify});
    fastify.post('/resend-otp', { onRequest: [authDealerMiddleware], preValidation: [validate(dealerUserResendOtpSchema)], handler: controller.resendOtp});

}

