import { FastifyInstance } from "fastify";
import { authSolutionPartnerMiddleware } from "../../middlewares/authSolutionPartnerMiddleware";
import SolutionPartnerNotificationController from "@/controllers/SolutionPartner/SolutionPartnerNotificationController";

export default async function solutionPartnerNotificationRoutes(fastify: FastifyInstance) {
  const solutionPartnerNotificationController = new SolutionPartnerNotificationController();

  // GET - Bildirimler datatable
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
      handler: solutionPartnerNotificationController.index,
  });
  fastify.get("/datatable", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: solutionPartnerNotificationController.dataTable,
  });

  // PUT - Bildirimi okundu olarak işaretle
  fastify.post("/read/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: solutionPartnerNotificationController.readNotification,
  });
}

