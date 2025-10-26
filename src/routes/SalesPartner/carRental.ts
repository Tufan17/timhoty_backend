import { FastifyInstance } from "fastify";
import CarRentalController from "@/controllers/SalePartner/CarRentalController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function carRentalRoutes(fastify: FastifyInstance) {
  const carRentalController = new CarRentalController();
  
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: carRentalController.getApprovedCarRentals,
  });
  fastify.get("/stations/:location_id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: carRentalController.getCarRentalStations,
  });
  fastify.get("/:id", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: carRentalController.getCarRentalById,
  });
  
}
