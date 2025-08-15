import { FastifyInstance } from "fastify";
import UserAuthController from "../controllers/Admin/UserController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { userSchema, userUpdateSchema } from "@/validators/user";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import UserModel from "@/models/UserModel";
import { validateFormData } from "@/middlewares/validateFormData";

export default async function adminUserRoutes(fastify: FastifyInstance) {
  const userController = new UserAuthController();

  const adminAuditLogger = makeAuditLogger({
    targetName: "users",
    model: new UserModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: userController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: userController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, adminAuditLogger],
    preValidation: [validateFormData(userSchema)],
    handler: userController.create,
    config: {
      multipart: true
    }
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, adminAuditLogger],
    preValidation: [validateFormData(userUpdateSchema)],
    handler: userController.update,
    config: {
      multipart: true
    }
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, adminAuditLogger],
    handler: userController.delete,
  });
}
