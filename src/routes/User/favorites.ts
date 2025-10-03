import { FastifyInstance } from 'fastify'
import FavoritesController from '@/controllers/User/FavoritesController'
import { authUserMiddleware } from '@/middlewares/authUserMiddleware'
import { validate } from '@/middlewares/validate'
import { toggleFavoriteSchema } from '@/validators/favorites'

export default async function favoritesRoutes(fastify: FastifyInstance) {
  const favoritesController = new FavoritesController()

  // Toggle favorite (add if not exists, remove if exists)
  fastify.post('/', {
    preHandler: [authUserMiddleware],
    preValidation: [validate(toggleFavoriteSchema)],
    handler: favoritesController.toggleFavorite
  })

  // Get all favorites for user
  fastify.get('/', {
    preHandler: [authUserMiddleware],
    handler: favoritesController.getAllFavorites
  })
}
