import { FastifyInstance } from "fastify";
import CarRentalReservationController from "@/controllers/SalePartner/CarRentalReservationController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function carRentalReservationRoutes(fastify: FastifyInstance) {
  const carRentalReservationController = new CarRentalReservationController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: carRentalReservationController.getSalesPartnerReservations,
  });
  
  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: carRentalReservationController.getReservationById,
  });
  fastify.get("/:id/preview", {
    preHandler: [authSalesPartnerMiddleware],
    handler: carRentalReservationController.previewSalesPartnerReservation,
  });
}