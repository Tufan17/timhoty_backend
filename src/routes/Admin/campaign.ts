import { FastifyInstance } from 'fastify'
import CampaignController from '../../controllers/Admin/CampaignController'
import { authAdminMiddleware } from '../../middlewares/authAdminMiddleware'



export default async function adminRoutes(fastify: FastifyInstance) {
  const controller = new CampaignController()
  fastify.get('/', controller.findAll)
  fastify.get('/end-eight', controller.findAllEndEight)
  fastify.get('/active', { preHandler: [] }, controller.findAllActive)
  fastify.get('/active-five', { preHandler: [] }, controller.findAllActiveFive)
  fastify.get('/landing', { preHandler: [] }, controller.findLandingAll)
  fastify.get('/:id', controller.findOne)
  fastify.post('/', { preHandler: [authAdminMiddleware],  handler: controller.create })
  fastify.put('/:id', { preHandler: [authAdminMiddleware],  handler: controller.update })
  fastify.delete('/:id', { preHandler: [authAdminMiddleware], handler: controller.delete })
  
}
