import { FastifyInstance } from "fastify";
import SalesPartnerController from "../../controllers/Admin/SalesPartnerController";
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import { validate } from "../../middlewares/validate";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import SalesPartnerModel from "../../models/SalesPartnerModel";
import { salesPartnerSchema, salesPartnerUpdateSchema } from "@/validators/salesPartner";

export default async function salesPartnerRoutes(fastify: FastifyInstance) {
  const salesPartnerController = new SalesPartnerController();
  
  const salesPartnerAuditLogger = makeAuditLogger({
    targetName: "sales_partners",
    model: new SalesPartnerModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: salesPartnerController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, salesPartnerAuditLogger],
    preValidation: [validate(salesPartnerSchema)],
    handler: salesPartnerController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerAuditLogger],
    preValidation: [validate(salesPartnerUpdateSchema)],
    handler: salesPartnerController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, salesPartnerAuditLogger],
    handler: salesPartnerController.delete,
  });
}
