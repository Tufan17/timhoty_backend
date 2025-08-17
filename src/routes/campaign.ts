import { FastifyInstance } from "fastify";
import CampaignController from "../controllers/Admin/CampaignController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { campaignSchema, campaignUpdateSchema } from "@/validators/campaign";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import CampaignModel from "@/models/CampaignModel";
import { validateFormData } from "@/middlewares/validateFormData";

export default async function campaignRoutes(fastify: FastifyInstance) {
  const campaignController = new CampaignController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "campaigns",
    model: new CampaignModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: campaignController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: campaignController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(campaignSchema)],
    handler: campaignController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(campaignUpdateSchema)],
    handler: campaignController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: campaignController.delete,
  });
}
