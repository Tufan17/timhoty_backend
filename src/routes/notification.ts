import { FastifyInstance } from "fastify";
import NotificationController from "../controllers/Admin/NotificationController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import { notificationSchema, notificationUpdateSchema } from "@/validators/notification";
import NotificationModel from "@/models/NotificationModel";
import { validate } from "@/middlewares/validate";

export default async function notificationRoutes(fastify: FastifyInstance) {
  const notificationController = new NotificationController();
  
  const notificationAuditLogger = makeAuditLogger({
    targetName: "notifications",
    model: new NotificationModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: notificationController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: notificationController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, notificationAuditLogger],
    preValidation: [validate(notificationSchema)],
    handler: notificationController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, notificationAuditLogger],
    preValidation: [validate(notificationUpdateSchema)],
    handler: notificationController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, notificationAuditLogger],
    handler: notificationController.delete,
  });
}
