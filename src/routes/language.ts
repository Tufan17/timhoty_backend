import { FastifyInstance } from "fastify";
import LanguageController from "../controllers/Admin/LanguageController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { validate } from "../middlewares/validate";
import { languageSchema, languageUpdateSchema } from "@/validators/language";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import LanguageModel from "@/models/LanguageModel";

export default async function languageRoutes(fastify: FastifyInstance) {
  const languageController = new LanguageController();
  
  const languageAuditLogger = makeAuditLogger({
    targetName: "languages",
    model: new LanguageModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: languageController.findAll,
  });
  fastify.get("/active", {
    preHandler: [authAdminMiddleware],
    handler: languageController.findAllActive,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: languageController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, languageAuditLogger],
    preValidation: [validate(languageSchema)],
    handler: languageController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, languageAuditLogger],
    preValidation: [validate(languageUpdateSchema)],
    handler: languageController.update,
  });
  fastify.delete("/:id", {
      preHandler: [authAdminMiddleware, languageAuditLogger],
    handler: languageController.delete,
  });
}
