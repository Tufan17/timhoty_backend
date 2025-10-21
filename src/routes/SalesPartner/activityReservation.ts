import { FastifyInstance } from "fastify";
import ActivityReservationController from "@/controllers/SalePartner/ActivityReservationController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function activityReservationRoutes(fastify: FastifyInstance) {
  const activityReservationController = new ActivityReservationController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: activityReservationController.getSalesPartnerReservations,
  });

  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: activityReservationController.getReservationById,
  });
  
  fastify.get("/preview/:id", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: activityReservationController.previewSalesPartnerReservation,
  });
}
