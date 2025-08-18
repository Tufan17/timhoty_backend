import { FastifyInstance } from "fastify";
import EmailSubscriptionController from "../controllers/Admin/EmailSubscriptionController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import { emailSubscriptionSchema, emailSubscriptionUpdateSchema } from "@/validators/emailSubscription";
import EmailSubscriptionModel from "@/models/EmailSubscriptionModel";
import { validate } from "@/middlewares/validate";

export default async function emailSubscriptionRoutes(fastify: FastifyInstance) {
  const emailSubscriptionController = new EmailSubscriptionController();
  
  const emailSubscriptionAuditLogger = makeAuditLogger({
    targetName: "email_subscriptions",
    model: new EmailSubscriptionModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: emailSubscriptionController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: emailSubscriptionController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, emailSubscriptionAuditLogger],
    preValidation: [validate(emailSubscriptionSchema)],
    handler: emailSubscriptionController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, emailSubscriptionAuditLogger],
    preValidation: [validate(emailSubscriptionUpdateSchema)],
    handler: emailSubscriptionController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, emailSubscriptionAuditLogger],
    handler: emailSubscriptionController.delete,
  });
  fastify.put("/:id/cancel", {
    preHandler: [authAdminMiddleware, emailSubscriptionAuditLogger],
    handler: emailSubscriptionController.cancel,
  });
  fastify.put("/:id/reactivate", {
    preHandler: [authAdminMiddleware, emailSubscriptionAuditLogger],
    handler: emailSubscriptionController.reactivate,
  });
}
