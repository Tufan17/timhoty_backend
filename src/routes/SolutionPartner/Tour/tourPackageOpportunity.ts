import { FastifyInstance } from "fastify";
import TourPackageOpportunityController from "../../../controllers/SolutionPartner/Tour/TourPackageOpportunityController";
import {
  tourPackageOpportunitySchema,
  tourPackageOpportunityUpdateSchema,
  tourPackageOpportunityQuerySchema,
} from "../../../validators/Tour/tourPackageOpportunity";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourPackageOpportunityModel from "@/models/TourPackageOpportunityModel";

export default async function tourPackageOpportunityRoutes(fastify: FastifyInstance) {
  const tourPackageOpportunityController = new TourPackageOpportunityController();

  const tourPackageOpportunityAuditLogger = makeAuditLogger({
    targetName: "tour_package_opportunities",
    model: new TourPackageOpportunityModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourPackageOpportunityQuerySchema)],
    handler: tourPackageOpportunityController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourPackageOpportunityController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourPackageOpportunityController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageOpportunityAuditLogger],
    preValidation: [validate(tourPackageOpportunitySchema)],
    handler: tourPackageOpportunityController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageOpportunityAuditLogger],
    preValidation: [validate(tourPackageOpportunityUpdateSchema)],
    handler: tourPackageOpportunityController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageOpportunityAuditLogger],
    handler: tourPackageOpportunityController.delete,
  });
}
