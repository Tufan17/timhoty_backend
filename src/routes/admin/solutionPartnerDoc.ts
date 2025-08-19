import { FastifyInstance } from "fastify";
import SolutionPartnerDocController from "../../controllers/Admin/SolutionPartnerDocController";
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import { solutionPartnerDocSchema, solutionPartnerDocUpdateSchema } from "@/validators/solutionPartner";
import SolutionPartnerDocModel from "@/models/SolutionPartnerDocModel";
import { validateFormData } from "@/middlewares/validateFormData";

export default async function adminRoutes(fastify: FastifyInstance) {
  const solutionPartnerDocController = new SolutionPartnerDocController();
  
  const solutionPartnerAuditLogger = makeAuditLogger({
    targetName: "solution_partner_docs",
    model: new SolutionPartnerDocModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/:solution_partner_id", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerDocController.findAll,
  });
  fastify.get("/doc/:id", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerDocController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validateFormData(solutionPartnerDocSchema)],
    handler: solutionPartnerDocController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validateFormData(solutionPartnerDocUpdateSchema)],
    handler: solutionPartnerDocController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    handler: solutionPartnerDocController.delete,
  });
}
