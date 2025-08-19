import { FastifyInstance } from "fastify";
import AdminAuthController from "../controllers/Auth/AdminAuthController";
import { validate } from "../middlewares/validate";
import { adminLoginSchema } from "@/validators/admin";
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware";
import UserAuthController from "@/controllers/Auth/UserAuthController";
import { AuthValidation } from "@/validators/userAuthValidation";

export default async function authRoutes(fastify: FastifyInstance) {
  const adminController = new AdminAuthController(); // Admin Auth Controller
  const userAuthController = new UserAuthController(); // User Auth Controller

  // ===========================================
  // ADMIN AUTH ROUTES
  // ===========================================
  fastify.post("/admin/login", {
    preValidation: [validate(adminLoginSchema)],
    handler: adminController.loginAdmin,
  });
  fastify.post("/admin/logout", {
    preValidation: [authAdminMiddleware],
    handler: adminController.logoutAdmin,
  });

  // ===========================================
  // USER AUTH ROUTES
  // ===========================================
  fastify.post("/user/login", {
    preValidation: [AuthValidation.login],
    handler: userAuthController.login,
  });
  fastify.post("/user/register", {
    preHandler: [AuthValidation.register],
    handler: userAuthController.register,
  });
}
