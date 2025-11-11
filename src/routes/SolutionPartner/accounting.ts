import { FastifyInstance } from "fastify";
import SolutionPartnerAccountingController from "../../controllers/SolutionPartner/SolutionPartnerAccountingController";
import { authSolutionPartnerMiddleware } from "../../middlewares/authSolutionPartnerMiddleware";

export default async function solutionPartnerAccountingRoutes(fastify: FastifyInstance) {
  const solutionPartnerAccountingController = new SolutionPartnerAccountingController();

  // GET - Muhasebe datatable
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: solutionPartnerAccountingController.dataTable,
  });
}

