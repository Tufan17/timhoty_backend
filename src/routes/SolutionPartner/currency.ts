import { FastifyInstance } from "fastify";
import CurrencyController from "../../controllers/SolutionPartner/CurrencyController";
import { authSolutionPartnerMiddleware } from "../../middlewares/authSolutionPartnerMiddleware";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import CurrencyModel from "@/models/CurrencyModel";

export default async function currencyRoutes(fastify: FastifyInstance) {
  const currencyController = new CurrencyController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "currencies",
    model: new CurrencyModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: currencyController.findAll,
  });
 
}
