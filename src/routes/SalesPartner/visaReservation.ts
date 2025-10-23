import { FastifyInstance } from "fastify";
import VisaReservationController from "@/controllers/SalePartner/VisaReservationController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function visaReservationRoutes(fastify: FastifyInstance) {
  const visaReservationController = new VisaReservationController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: visaReservationController.getSalesPartnerReservations,
  });

  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: visaReservationController.getReservationById,
  });
  fastify.get("/preview/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: visaReservationController.previewSalesPartnerReservation,
  });
}
