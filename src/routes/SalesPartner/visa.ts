import { FastifyInstance } from "fastify";
import VisaController from "@/controllers/SalePartner/VisaController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function visaRoutes(fastify: FastifyInstance) {
  const visaController = new VisaController();
  
  fastify.get("/", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: visaController.getApprovedVisas,
  });
  fastify.get("/:id", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: visaController.getVisaById,
  });
}
