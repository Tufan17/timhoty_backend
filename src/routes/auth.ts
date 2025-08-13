import { FastifyInstance } from 'fastify'
import AdminAuthController from '../controllers/Auth/AdminAuthController'


export default async function authRoutes(fastify: FastifyInstance) {
  const adminController = new AdminAuthController()
  fastify.post('/admin/login', { handler: adminController.loginAdmin })
  fastify.post('/admin/logout', { handler: adminController.logoutAdmin })







}
