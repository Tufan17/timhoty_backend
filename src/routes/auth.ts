import { FastifyInstance } from 'fastify'
import AuthController from '../controllers/AuthController'
import { authAdminMiddleware } from '../middlewares/authAdminMiddleware'
import { adminLoginSchema } from '../validators/auth'
import { validate } from '../middlewares/validate'
import { dealerLoginSchema } from '../validators/auth'
import { authDealerMiddleware } from '../middlewares/authDealerMiddleware'
import { userLoginSchema, userVerifyOtpSchema, userRegisterSchema } from '../validators/auth'
import { authUserMiddleware } from '../middlewares/authUserMiddleware'

export default async function authRoutes(fastify: FastifyInstance) {
  const controller = new AuthController()

  // Admin 
  fastify.post('/admin/login', { preValidation: [validate(adminLoginSchema)], handler: controller.loginAdmin })
  fastify.post('/admin/logout', { onRequest: [authAdminMiddleware], handler: controller.logoutAdmin })

  // Dealer
  fastify.post('/dealer/login', { preValidation: [validate(dealerLoginSchema)], handler: controller.loginDealer })
  fastify.post('/dealer/logout', { onRequest: [authDealerMiddleware], handler: controller.logoutDealer })

  // User
  fastify.post('/user/login', { preValidation: [validate(userLoginSchema)], handler: controller.loginUser })
  fastify.post('/user/resend-code',controller.resendCodeUser )
  fastify.post('/user/verify', {onRequest: [authUserMiddleware], preValidation: [validate(userVerifyOtpSchema)], handler: controller.verifyOtpUser })
  fastify.post('/user/register', {onRequest: [authUserMiddleware], preValidation: [validate(userRegisterSchema)], handler: controller.registerUser })
  fastify.post('/user/logout', { onRequest: [authUserMiddleware], handler: controller.logoutUser })

}
