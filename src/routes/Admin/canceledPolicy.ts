import { FastifyInstance } from 'fastify'
import CanceledPolicyController from '../../controllers/Admin/CanceledPolicyController'
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate'

export default async function adminRoutes(fastify: FastifyInstance) {
  const controller = new CanceledPolicyController()
  fastify.post('/', { preHandler: [authAdminMiddleware],  handler: controller.create })
  
}
