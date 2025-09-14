import { FastifyInstance } from 'fastify'
import { authUserMiddleware } from '@/middlewares/authUserMiddleware'
import UserCountriesController from '@/controllers/User/CountriesController'

export default async function userRoutes(fastify: FastifyInstance) {
    const userCountriesController = new UserCountriesController()
    fastify.get('/', {
        handler: userCountriesController.getAll,
        preHandler: [authUserMiddleware]
    })

}
