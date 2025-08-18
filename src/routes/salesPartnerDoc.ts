import { FastifyInstance } from "fastify";
import SalesPartnerDocController from "../controllers/Admin/SalesPartnerDocController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import { salesPartnerDocSchema, salesPartnerDocUpdateSchema } from "@/validators/salesPartner";
import SalesPartnerDocModel from "@/models/SalesPartnerDocModel";
import { validateFormData } from "@/middlewares/validateFormData";

export default async function salesPartnerDocRoutes(fastify: FastifyInstance) {
  const salesPartnerDocController = new SalesPartnerDocController();
  
  const salesPartnerDocAuditLogger = makeAuditLogger({
    targetName: "sales_partner_docs",
    model: new SalesPartnerDocModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/:sales_partner_id", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerDocController.findAll,
  });
  fastify.get("/doc/:id", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerDocController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, salesPartnerDocAuditLogger],
    preValidation: [validateFormData(salesPartnerDocSchema)],
    handler: salesPartnerDocController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerDocAuditLogger],
    preValidation: [validateFormData(salesPartnerDocUpdateSchema)],
    handler: salesPartnerDocController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerDocAuditLogger],
    handler: salesPartnerDocController.delete,
  });
}
