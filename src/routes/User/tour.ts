import { FastifyInstance } from "fastify";
import TourController from "../../controllers/User/TourController";

export default async function tourRoutes(fastify: FastifyInstance) {
  const tourController = new TourController();

  fastify.get("/", {
    handler: tourController.dataTable,
  });

  fastify.get("/all", {
    handler: tourController.findAll,
  });

  fastify.get("/featured", {
    handler: tourController.featured,
  });

  fastify.get("/:id", {
    handler: tourController.findOne,
  });
}
