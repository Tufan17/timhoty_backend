import { FastifyInstance } from "fastify";
import CityController from "../../controllers/SalePartner/CityController";

export default async function cityRoutes(fastify: FastifyInstance) {
  const cityController = new CityController();
  
  fastify.get("/all", {
    handler: cityController.findAll,
  });
}
