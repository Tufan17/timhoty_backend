import { FastifyInstance } from "fastify";
import SalesPartnerAccountingController from "../../controllers/SalePartner/SalesPartnerAccountingController";
import { authSalesPartnerMiddleware } from "../../middlewares/authSalesPartnerMiddleware";

export default async function salesPartnerAccountingRoutes(fastify: FastifyInstance) {
  const salesPartnerAccountingController = new SalesPartnerAccountingController();

  // GET - Muhasebe datatable
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerAccountingController.dataTable,
  });
}

