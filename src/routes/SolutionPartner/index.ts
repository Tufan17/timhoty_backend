import { FastifyInstance } from "fastify";
import SolutionPartnerIndexController from "@/controllers/SolutionPartner/SolutionPartnerIndexModel";

import { validate } from "@/middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import { solutionPartnerUpdateSchema } from "@/validators/solutionPartner";

export default async function solutionPartnerIndexRoutes(fastify: FastifyInstance) {
  const solutionPartnerIndexController = new SolutionPartnerIndexController();

  // GET - Okuma işlemi
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: solutionPartnerIndexController.getIndex,
  });

  fastify.get("/commissions", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: solutionPartnerIndexController.getCommissions,
  });

  // PUT - Güncelleme işlemi
  fastify.put("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(solutionPartnerUpdateSchema)],
    handler: solutionPartnerIndexController.updateIndex,
  });
}
