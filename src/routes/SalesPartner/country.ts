import { FastifyInstance } from "fastify";
import CountryController from "../../controllers/SalePartner/CountryController";

export default async function countryRoutes(fastify: FastifyInstance) {
  const countryController = new CountryController();
  
  fastify.get("/all", {
    handler: countryController.findAll,
  });
}
