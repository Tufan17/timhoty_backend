import { FastifyInstance } from 'fastify';
import UserController from '../../controllers/Dealer/UserController';
import { authDealerMiddleware } from '../../middlewares/authDealerMiddleware'
import { validate } from '../../middlewares/validate';
import { customerSchema, customerUpdateSchema, customerVerificationSchema, customerResendOtpSchema } from '../../validators/Dealer/customer';

export default async function UserRoutes(fastify: FastifyInstance) {
    const controller = new UserController()
    fastify.get('/datatable', { onRequest: [authDealerMiddleware], handler: controller.dataTable});
    fastify.get('/:id', { onRequest: [authDealerMiddleware], handler: controller.findOne});
    
    fastify.post('/', { onRequest: [authDealerMiddleware], preValidation: [validate(customerSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authDealerMiddleware], preValidation: [validate(customerUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authDealerMiddleware], handler: controller.delete});
    fastify.post('/verify', { onRequest: [authDealerMiddleware], preValidation: [validate(customerVerificationSchema)], handler: controller.verify});
    fastify.post('/resend-otp', { onRequest: [authDealerMiddleware], preValidation: [validate(customerResendOtpSchema)], handler: controller.resendOtp});
}

