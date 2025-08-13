import { FastifyInstance } from "fastify";
import AdminAuthController from "../controllers/Admin/AdminController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { validate } from "../middlewares/validate";
import { adminSchema, adminUpdateSchema } from "@/validators/admin";

export default async function adminRoutes(fastify: FastifyInstance) {
  const adminController = new AdminAuthController();
  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: adminController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: adminController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware],
    preValidation: [validate(adminSchema)],
    handler: adminController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware],
    preValidation: [validate(adminUpdateSchema)],
    handler: adminController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware],
    handler: adminController.delete,
  });
}
