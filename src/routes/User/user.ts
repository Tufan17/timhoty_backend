import { FastifyInstance } from 'fastify'
import UserController from '@/controllers/User/UserController'
import { authUserMiddleware } from '@/middlewares/authUserMiddleware'

export default async function userRoutes(fastify: FastifyInstance) {
  const userController = new UserController()
  fastify.get('/:id', {
    handler: userController.read,
    preHandler: [authUserMiddleware]
  })
  }
