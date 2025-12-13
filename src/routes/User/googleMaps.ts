import { FastifyInstance } from "fastify";
import GoogleMapsController from "@/controllers/User/GoogleMapsController";

export default async function googleMapsRoutes(fastify: FastifyInstance) {
  const googleMapsController = new GoogleMapsController();

  // Yer arama endpoint'i (hem GET hem POST destekler)
  fastify.get("/search", {
    handler: googleMapsController.search.bind(googleMapsController),
  });
  
  fastify.post("/search", {
    handler: googleMapsController.search.bind(googleMapsController),
  });

  // Place detayları endpoint'i
  fastify.get("/details/:place_id", {
    handler: googleMapsController.getDetails.bind(googleMapsController),
  });
}

