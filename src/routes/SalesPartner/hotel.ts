import { FastifyInstance } from "fastify";
import HotelController from "@/controllers/SalePartner/HotelController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function hotelRoutes(fastify: FastifyInstance) {
  const hotelController = new HotelController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: hotelController.getApprovedHotels,
  });
  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: hotelController.getHotelById,
  });
}
