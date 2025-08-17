import { FastifyInstance } from "fastify";
import FaqController from "../controllers/Admin/FaqController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { faqSchema, faqUpdateSchema } from "@/validators/faq";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import FaqModel from "@/models/FaqModel";
import { validate } from "@/middlewares/validate";

export default async function faqRoutes(fastify: FastifyInstance) {
  const faqController = new FaqController();
  
  const faqAuditLogger = makeAuditLogger({
    targetName: "faqs",
    model: new FaqModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: faqController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: faqController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, faqAuditLogger],
    preValidation: [validate(faqSchema)],
    handler: faqController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, faqAuditLogger],
    preValidation: [validate(faqUpdateSchema)],
    handler: faqController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, faqAuditLogger],
    handler: faqController.delete,
  });
}
