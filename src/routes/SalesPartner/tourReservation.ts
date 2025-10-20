import { FastifyInstance } from "fastify";
import TourReservationController from "@/controllers/SalePartner/TourReservationController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function hotelReservationRoutes(fastify: FastifyInstance) {
  const tourReservationController = new TourReservationController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: tourReservationController.getSalesPartnerReservations,
  });

  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: tourReservationController.getReservationById,
  });
  fastify.get("/preview/:id", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: tourReservationController.previewSalesPartnerReservation,
  });
}
