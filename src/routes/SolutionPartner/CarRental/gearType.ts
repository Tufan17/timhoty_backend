
import { FastifyInstance } from "fastify";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import GearTypeController from "@/controllers/SolutionPartner/CarRental/GearTypeController";

export default async function gearTypeRoutes(fastify: FastifyInstance) {
  const gearTypeController = new GearTypeController();
  
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: gearTypeController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: gearTypeController.findOne,
  });
}
    