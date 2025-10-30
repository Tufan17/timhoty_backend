import { FastifyInstance } from "fastify";
import SalesPartnerHotelController from "@/controllers/SalePartner/TourController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function salesPartnerHotelRoutes(fastify: FastifyInstance) {
  const salesPartnerHotelController = new SalesPartnerHotelController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerHotelController.getApprovedTours,
  });
  fastify.get("/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerHotelController.getTourById,
  });
}
