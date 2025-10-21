import { FastifyInstance } from "fastify";
import ActivityController from "@/controllers/SalePartner/ActivityController";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";

export default async function activityRoutes(fastify: FastifyInstance) {
  const activityController = new ActivityController();
  
  fastify.get("/", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: activityController.getApprovedActivities,
  });
  fastify.get("/:id", {
    // preHandler: [authSalesPartnerMiddleware],
    handler: activityController.getActivityById,
  });
}
