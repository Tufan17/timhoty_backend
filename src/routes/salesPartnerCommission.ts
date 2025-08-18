import { FastifyInstance } from "fastify";
import SalesPartnerCommissionController from "../controllers/Admin/SalesPartnerCommissionController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import { salesPartnerCommissionSchema, salesPartnerCommissionUpdateSchema } from "@/validators/salesPartner";
import SalesPartnerCommissionModel from "@/models/SalesPartnerCommissionModel";
import { validate } from "@/middlewares/validate";

export default async function salesPartnerCommissionRoutes(fastify: FastifyInstance) {
  const salesPartnerCommissionController = new SalesPartnerCommissionController();
  
  const salesPartnerCommissionAuditLogger = makeAuditLogger({
    targetName: "sales_partner_commissions",
    model: new SalesPartnerCommissionModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerCommissionController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerCommissionController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, salesPartnerCommissionAuditLogger],
    preValidation: [validate(salesPartnerCommissionSchema)],
    handler: salesPartnerCommissionController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerCommissionAuditLogger],
    preValidation: [validate(salesPartnerCommissionUpdateSchema)],
    handler: salesPartnerCommissionController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerCommissionAuditLogger],
    handler: salesPartnerCommissionController.delete,
  });
}
