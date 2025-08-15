import { FastifyInstance } from "fastify";
import LogsController from "../controllers/LogsController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";

export default async function permissionRoutes(fastify: FastifyInstance) {
  const controller = new LogsController();
  fastify.get("/", {
    onRequest: [authAdminMiddleware],
    handler: controller.findAll,
  });
  fastify.get("/:id", {
    onRequest: [authAdminMiddleware],
    handler: controller.findOne,
  });
}
