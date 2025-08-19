import { FastifyInstance } from "fastify";
import SalesPartnerUserController from "../../controllers/Admin/SalesPartnerUserController";
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import { salesPartnerUserSchema, salesPartnerUserUpdateSchema } from "@/validators/salesPartner";
import SalesPartnerUserModel from "@/models/SalesPartnerUserModel";
import { validate } from "@/middlewares/validate";

export default async function salesPartnerUserRoutes(fastify: FastifyInstance) {
  const salesPartnerUserController = new SalesPartnerUserController();
  
  const salesPartnerUserAuditLogger = makeAuditLogger({
    targetName: "sales_partner_users",
    model: new SalesPartnerUserModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerUserController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerUserController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, salesPartnerUserAuditLogger],
    preValidation: [validate(salesPartnerUserSchema)],
    handler: salesPartnerUserController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerUserAuditLogger],
    preValidation: [validate(salesPartnerUserUpdateSchema)],
    handler: salesPartnerUserController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerUserAuditLogger],
    handler: salesPartnerUserController.delete,
  });
}
