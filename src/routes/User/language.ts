import { FastifyInstance } from 'fastify'
import { authUserMiddleware } from '@/middlewares/authUserMiddleware'
import UserLanguageController from '@/controllers/User/LanguageController'

export default async function userRoutes(fastify: FastifyInstance) {
    const userLanguageController = new UserLanguageController()
    fastify.get('/', {
        handler: userLanguageController.getAll,
        preHandler: [authUserMiddleware]
    })

}
