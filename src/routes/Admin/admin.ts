import { FastifyInstance } from "fastify";
import AdminAuthController from "../../controllers/Admin/AdminController";
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import { validate } from "../../middlewares/validate";
import { adminSchema, adminUpdateSchema } from "@/validators/admin";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import AdminModel from "../../models/Admin/AdminModel";

export default async function adminRoutes(fastify: FastifyInstance) {
  const adminController = new AdminAuthController();
  
  // Audit logger'ı admin modeli için oluştur
  const adminAuditLogger = makeAuditLogger({
    targetName: "admins",
    model: new AdminModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: adminController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: adminController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, adminAuditLogger],
    preValidation: [validate(adminSchema)],
    handler: adminController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, adminAuditLogger],
    preValidation: [validate(adminUpdateSchema)],
    handler: adminController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, adminAuditLogger],
    handler: adminController.delete,
  });
}
