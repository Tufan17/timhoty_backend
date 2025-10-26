import { FastifyInstance } from "fastify";
import SalesPartnerIndexController from "@/controllers/SalePartner/SalesPartnerIndexModel";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";
import { validate } from "@/middlewares/validate";
import { salesPartnerIndexUpdateSchema } from "@/validators/salesPartner";

export default async function salesPartnerIndexRoutes(fastify: FastifyInstance) {
  const salesPartnerIndexController = new SalesPartnerIndexController();

  // GET - Okuma işlemi
  fastify.get("/", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerIndexController.getIndex,
  });

  fastify.get("/commissions", {
    preHandler: [authSalesPartnerMiddleware],
    handler: salesPartnerIndexController.getCommissions,
  });

  // PUT - Güncelleme işlemi
  fastify.put("/", {
    preHandler: [authSalesPartnerMiddleware],
    preValidation: [validate(salesPartnerIndexUpdateSchema)],
    handler: salesPartnerIndexController.updateIndex,
  });
}