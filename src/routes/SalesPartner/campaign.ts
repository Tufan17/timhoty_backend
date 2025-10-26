import { FastifyInstance } from "fastify";
import CampaignController from "../../controllers/SalePartner/CampaignController";
import { authSalesPartnerMiddleware } from "../../middlewares/authSalesPartnerMiddleware";

export default async function campaignRoutes(fastify: FastifyInstance) {
  const campaignController = new CampaignController();

  // GET - Tüm kampanyalar (datatable)
  fastify.get("/", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: campaignController.dataTable,
  });

  // GET - Kampanya detayı
  fastify.get("/:id", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: campaignController.getById,
  });
}

