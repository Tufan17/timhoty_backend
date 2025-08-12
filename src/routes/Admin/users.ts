import { FastifyInstance } from 'fastify';
import UserController from '../../controllers/Admin/UserController';
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';
import { userSchema, userUpdateSchema, userVerificationSchema, userResendOtpSchema } from '../../validators/Admin/users';

export default async function UserRoutes(fastify: FastifyInstance) {
    const controller = new UserController()
    fastify.get('/datatable', { onRequest: [authAdminMiddleware], handler: controller.dataTable});
    fastify.get('/:id', { onRequest: [authAdminMiddleware], handler: controller.findOne});
    
    fastify.post('/', { onRequest: [authAdminMiddleware], preValidation: [validate(userSchema)], handler: controller.create});
    fastify.put('/:id', { onRequest: [authAdminMiddleware], preValidation: [validate(userUpdateSchema)], handler: controller.update});
    fastify.delete('/:id', { onRequest: [authAdminMiddleware], handler: controller.delete});
    fastify.post('/verify', { onRequest: [authAdminMiddleware], preValidation: [validate(userVerificationSchema)], handler: controller.verify});
    fastify.post('/resend-otp', { onRequest: [authAdminMiddleware], preValidation: [validate(userResendOtpSchema)], handler: controller.resendOtp});
}

