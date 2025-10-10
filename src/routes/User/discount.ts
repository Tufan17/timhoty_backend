import { FastifyInstance } from 'fastify'
import DiscountController from '@/controllers/User/DiscountController'

export default async function favoritesRoutes(fastify: FastifyInstance) {
  const discountController = new DiscountController()
  fastify.post('/', {
    handler: discountController.index
  })

}
