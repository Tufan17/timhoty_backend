import { FastifyInstance } from "fastify";
import ReservationController from "@/controllers/User/ReservationController";
import { authUserMiddleware } from "@/middlewares/authUserMiddleware";

export default async function reservationRoutes(fastify: FastifyInstance) {
  const reservationController = new ReservationController();
  fastify.get("/", {
    handler: reservationController.index,
    preHandler: [authUserMiddleware],
  });
  fastify.get("/:id", {
    handler: reservationController.show,
    preHandler: [authUserMiddleware],
  });
}
