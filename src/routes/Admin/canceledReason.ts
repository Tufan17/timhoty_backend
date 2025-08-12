import { FastifyInstance } from 'fastify'
import CanceledReasonController from '../../controllers/Admin/CanceledReasonController'
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { canceledReasonSchema, canceledReasonUpdateSchema } from '../../validators/Admin/canceled_reasons'
import { validate } from '../../middlewares/validate'

export default async function adminRoutes(fastify: FastifyInstance) {
  const controller = new CanceledReasonController()
  fastify.get('/', { preHandler: [] }, controller.findAll)
  fastify.get('/:id', { preHandler: [authAdminMiddleware] }, controller.findOne)
  fastify.post('/', { preHandler: [authAdminMiddleware],preValidation: [validate(canceledReasonSchema)],  handler: controller.create })
  fastify.put('/:id', { preHandler: [authAdminMiddleware],preValidation: [validate(canceledReasonUpdateSchema)],  handler: controller.update })
  fastify.delete('/:id', { preHandler: [authAdminMiddleware], handler: controller.delete })
  
}
