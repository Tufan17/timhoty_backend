import { FastifyInstance } from "fastify";
import SalesPartnerNotificationController from "../../controllers/SalePartner/SalesPartnerNotificationController";
import { authSalesPartnerMiddleware } from "../../middlewares/authSalesPartnerMiddleware";

export default async function salesPartnerNotificationRoutes(fastify: FastifyInstance) {
  const salesPartnerNotificationController = new SalesPartnerNotificationController();

  // GET - Bildirimler datatable
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerNotificationController.index,
  });
  fastify.get("/datatable", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerNotificationController.dataTable,
  });

  // PUT - Bildirimi okundu olarak işaretle
  fastify.post("/read/:id", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerNotificationController.readNotification,
  });
}

