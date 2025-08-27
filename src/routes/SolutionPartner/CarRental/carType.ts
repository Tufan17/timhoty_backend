import { FastifyInstance } from "fastify";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CarTypeController from "@/controllers/SolutionPartner/CarRental/CarTypeController";

export default async function carTypeRoutes(fastify: FastifyInstance) {
  const carTypeController = new CarTypeController();
  
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carTypeController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carTypeController.findOne,
  });
}
    