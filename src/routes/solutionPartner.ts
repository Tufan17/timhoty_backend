import { FastifyInstance } from "fastify";
import SolutionPartnerController from "../controllers/Admin/SolutionPartnerController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { validate } from "../middlewares/validate";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import SolutionPartnerModel from "../models/SolutionPartnerModel";
import { solutionPartnerSchema, solutionPartnerUpdateSchema } from "@/validators/solutionPartner";

export default async function adminRoutes(fastify: FastifyInstance) {
  const solutionPartnerController = new SolutionPartnerController();
  
  const solutionPartnerAuditLogger = makeAuditLogger({
    targetName: "solution_partners",
    model: new SolutionPartnerModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validate(solutionPartnerSchema)],
    handler: solutionPartnerController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validate(solutionPartnerUpdateSchema)],
    handler: solutionPartnerController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    handler: solutionPartnerController.delete,
  });
}
