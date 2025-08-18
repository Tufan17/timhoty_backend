import { FastifyInstance } from 'fastify'
import UserController from '@/controllers/User/UserController'

export default async function userRoutes(fastify: FastifyInstance) {
  const userController = new UserController()
  fastify.get('/:id', {
    handler: userController.read   
  })
  }
