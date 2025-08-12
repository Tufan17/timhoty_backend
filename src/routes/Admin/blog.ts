import { FastifyInstance } from 'fastify'
import BlogController from '../../controllers/Admin/BlogController'
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'
import { validate } from '../../middlewares/validate';
import { blogSchema, blogUpdateSchema } from '../../validators/Admin/blog'



export default async function adminRoutes(fastify: FastifyInstance) {
  const controller = new BlogController()

  fastify.get('/', controller.findAll)
  fastify.get('/end-eight', controller.findAllEndEight)
  fastify.get('/active-five', controller.findAllActiveFive)
  fastify.get('/:id', controller.findOne)
  fastify.post('/', { preHandler: [authAdminMiddleware],  handler: controller.create })
  fastify.put('/:id', { preHandler: [authAdminMiddleware],  handler: controller.update })
  fastify.delete('/:id', { preHandler: [authAdminMiddleware], handler: controller.delete })
  
}
