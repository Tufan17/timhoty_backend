import { FastifyInstance } from "fastify";
import HotelReservationController from "@/controllers/SalePartner/HotelReservationController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function hotelReservationRoutes(fastify: FastifyInstance) {
  const hotelReservationController = new HotelReservationController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: hotelReservationController.getSalesPartnerReservations,
  });

  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: hotelReservationController.getReservationById,
  });
}
