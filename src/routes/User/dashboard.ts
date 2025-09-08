import { FastifyInstance } from 'fastify'
import DashboardController from '@/controllers/User/DashboardController'

export default async function userRoutes(fastify: FastifyInstance) {
  const dashboardController = new DashboardController()
  fastify.get('/', {
    handler: dashboardController.index
  })
  }
