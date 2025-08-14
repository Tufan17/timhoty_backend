import { FastifyInstance } from 'fastify'
import AdminAuthController from '../controllers/Auth/AdminAuthController'
import { validate } from "../middlewares/validate";
import {
  adminLoginSchema,
} from "@/validators/admin";
import { authAdminMiddleware } from '@/middlewares/authAdminMiddleware';


export default async function authRoutes(fastify: FastifyInstance) {
  const adminController = new AdminAuthController()
  fastify.post('/admin/login', {
    preValidation: [validate(adminLoginSchema)],
    handler: adminController.loginAdmin
  })
  fastify.post('/admin/logout', {
    preValidation: [authAdminMiddleware],
    handler: adminController.logoutAdmin
  })







}
