import { FastifyInstance } from "fastify";
import SolutionPartnerUserController from "../controllers/Admin/SolutionPartnerUserController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import { solutionPartnerUserSchema, solutionPartnerUserUpdateSchema } from "@/validators/solutionPartner";
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel";
import { validate } from "@/middlewares/validate";

export default async function adminRoutes(fastify: FastifyInstance) {
  const solutionPartnerUserController = new SolutionPartnerUserController();
  
  const solutionPartnerAuditLogger = makeAuditLogger({
    targetName: "solution_partner_users",
    model: new SolutionPartnerUserModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerUserController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: solutionPartnerUserController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validate(solutionPartnerUserSchema)],
    handler: solutionPartnerUserController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    preValidation: [validate(solutionPartnerUserUpdateSchema)],
    handler: solutionPartnerUserController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, solutionPartnerAuditLogger],
    handler: solutionPartnerUserController.delete,
  });
}
