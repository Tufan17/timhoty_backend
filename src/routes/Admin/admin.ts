import { FastifyInstance } from 'fastify'
import AdminController from '../../controllers/Admin/AdminController'
import { adminSchema, adminUpdateSchema } from '../../validators/Admin/admin'
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';



export default async function adminRoutes(fastify: FastifyInstance) {
  const controller = new AdminController()

  fastify.get('/', { preHandler: [authAdminMiddleware] }, controller.findAll)
  fastify.get('/:id', { preHandler: [authAdminMiddleware] }, controller.findOne)
  fastify.post('/', { preHandler: [authAdminMiddleware], preValidation: [validate(adminSchema)], handler: controller.create })
  fastify.put('/:id', { preHandler: [authAdminMiddleware], preValidation: [validate(adminUpdateSchema)], handler: controller.update })
  fastify.delete('/:id', { preHandler: [authAdminMiddleware], handler: controller.delete })
  
}
