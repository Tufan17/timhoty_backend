import { FastifyInstance } from "fastify";
import AdminAuthController from "../controllers/Auth/AdminAuthController";
import { validate } from "../middlewares/validate";
import { adminLoginSchema } from "@/validators/admin";
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware";
import UserAuthController from "@/controllers/Auth/UserAuthController";
import { AuthValidation } from "@/validators/userAuthValidation";
import SolutionPartnerAuthController from "@/controllers/Auth/SolutionPartnerAuthController";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import { forgotPasswordSchema, resetPasswordSchema, solutionPartnerRegisterSchema, verifyCodeSchema } from "@/validators/solutionPartner";
import { authUserMiddleware } from "@/middlewares/authUserMiddleware";
import SalesPartnerAuthController from "@/controllers/Auth/SalesPartnerAuthController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";
import { salesPartnerLoginSchema, salesPartnerRegisterSchema } from "@/validators/salesPartner";

export default async function authRoutes(fastify: FastifyInstance) {
  const adminController = new AdminAuthController(); // Admin Auth Controller
  const userAuthController = new UserAuthController(); // User Auth Controller
  const solutionPartnerAuthController = new SolutionPartnerAuthController(); // Solution Partner Auth Controller
  const salesPartnerAuthController = new SalesPartnerAuthController(); // Sales Partner Auth Controller

  // ===========================================
  // ADMIN AUTH ROUTES
  // ===========================================
  fastify.post("/admin/login", {
    preValidation: [validate(adminLoginSchema)],
    handler: adminController.loginAdmin,
  });
  fastify.post("/admin/logout", {
    preHandler: [authAdminMiddleware],
    handler: adminController.logoutAdmin,
  });

  // ===========================================
  // USER AUTH ROUTES
  // ===========================================
  fastify.post("/user/login", {
    preValidation: [AuthValidation.login],
    handler: userAuthController.login,
  });
  
  fastify.post("/user/google/login", {
    handler: userAuthController.googleLogin,
  });
  fastify.post("/user/facebook/login", {
    handler: userAuthController.facebookLogin,
  });
  fastify.post("/user/apple/login", {
    handler: userAuthController.appleLogin,
  });
  
  fastify.post("/user/register", {
    preHandler: [AuthValidation.register],
    handler: userAuthController.register,
  });
  fastify.post("/user/logout", {
    preHandler: [authUserMiddleware],
    handler: userAuthController.logout,
  });
  fastify.post("/user/access-token-renew", {
    handler: userAuthController.accessTokenRenew,
  });
  fastify.post("/user/forgot-password", {
    preValidation: [validate(forgotPasswordSchema)],
    handler: userAuthController.forgotPassword,
  });
  fastify.post("/user/verify-code", {
    preValidation: [validate(verifyCodeSchema)],
    handler: userAuthController.verifyCode,
  });

  fastify.post("/user/reset-password", {
    preValidation: [validate(resetPasswordSchema)],
    handler: userAuthController.resetPassword,
  });


  // ===========================================
  // SOLUTION PARTNER AUTH ROUTES
  // ===========================================
  fastify.post("/solution-partner/login", {
    preValidation: [AuthValidation.login],
    handler: solutionPartnerAuthController.login,
  });
  fastify.post("/solution-partner/register", {
    preValidation: [validate(solutionPartnerRegisterSchema)],
    handler: solutionPartnerAuthController.register,
  }); 
  fastify.post("/solution-partner/logout", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: solutionPartnerAuthController.logout,
  });

  // ===========================================
  // SALE PARTNER AUTH ROUTES
  // ===========================================
  fastify.post("/sales-partner/login", {
    preValidation: [validate(salesPartnerLoginSchema)],
    handler: salesPartnerAuthController.login,
  });
  fastify.post("/sales-partner/register", {
    preValidation: [validate(salesPartnerRegisterSchema)],
    handler: salesPartnerAuthController.register,
  });
  fastify.post("/sales-partner/logout", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerAuthController.logout,
  });
}
