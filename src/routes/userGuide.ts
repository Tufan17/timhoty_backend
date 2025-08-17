import { FastifyInstance } from "fastify";
import UserGuideController from "../controllers/Admin/UserGuideController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { userGuideSchema, userGuideUpdateSchema } from "@/validators/userGuide";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import UserGuideModel from "@/models/UserGuideModel";
import { validate } from "@/middlewares/validate";

export default async function userGuideRoutes(fastify: FastifyInstance) {
  const userGuideController = new UserGuideController();
  
  const userGuideAuditLogger = makeAuditLogger({
    targetName: "user_guides",
    model: new UserGuideModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: userGuideController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: userGuideController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, userGuideAuditLogger],
    preValidation: [validate(userGuideSchema)],
    handler: userGuideController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, userGuideAuditLogger],
    preValidation: [validate(userGuideUpdateSchema)],
    handler: userGuideController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, userGuideAuditLogger],
    handler: userGuideController.delete,
  });
}
