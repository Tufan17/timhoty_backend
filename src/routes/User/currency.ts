import { FastifyInstance } from 'fastify'
import UserController from '@/controllers/User/CurrencyController'
import { authUserMiddleware } from '@/middlewares/authUserMiddleware'

export default async function userRoutes(fastify: FastifyInstance) {
    const userController = new UserController()
    fastify.get('/', {
        handler: userController.getAll,
        preHandler: [authUserMiddleware]
    })

}
