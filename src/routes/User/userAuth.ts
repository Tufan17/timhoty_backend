import { FastifyInstance } from 'fastify'
import UserAuthController from '@/controllers/Auth/UserAuthController'
import { AuthValidation } from '@/validators/userAuthValidation'

export default async function userAuthRoutes(fastify: FastifyInstance) {
  const userAuthController = new UserAuthController()

  fastify.post('/register', {
    preHandler: [AuthValidation.register],
    handler: userAuthController.register
  })
}
