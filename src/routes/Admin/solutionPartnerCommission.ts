import { FastifyInstance } from "fastify";
import SolutionPartnerCommissionController from "../../controllers/Admin/SolutionPartnerCommissionController";
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import { solutionPartnerCommissionSchema, solutionPartnerCommissionUpdateSchema } from "@/validators/solutionPartner";
import SolutionPartnerCommissionModel from "@/models/SolutionPartnerCommissionModel";
import { validate } from "@/middlewares/validate";

export default async function adminRoutes(fastify: FastifyInstance) {
  const solutionPartnerCommissionController = new SolutionPartnerCommissionController();
  
  const solutionPartnerAuditLogger = makeAuditLogger({
    targetName: "solution_partner_commissions",
    model: new SolutionPartnerCommissionModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerCommissionController.dataTable,
  });
  fastify.get("/all/:id", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerCommissionController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerCommissionController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validate(solutionPartnerCommissionSchema)],
    handler: solutionPartnerCommissionController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validate(solutionPartnerCommissionUpdateSchema)],
    handler: solutionPartnerCommissionController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    handler: solutionPartnerCommissionController.delete,
  });
}
