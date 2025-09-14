import { FastifyInstance } from "fastify";
import TourFeatureController from "../../../controllers/SolutionPartner/Tour/TourFeatureController";
import {
  tourFeatureSchema,
  tourFeatureUpdateSchema,
  tourFeatureQuerySchema,
} from "../../../validators/Tour/tourFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourFeatureModel from "@/models/TourFeatureModel";

export default async function hotelFeatureRoutes(fastify: FastifyInstance) {
  const tourFeatureController = new TourFeatureController();

  const tourFeatureAuditLogger = makeAuditLogger({
    targetName: "tour_features",
    model: new TourFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourFeatureQuerySchema)],
    handler: tourFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourFeatureController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourFeatureController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourFeatureAuditLogger],
    preValidation: [validate(tourFeatureSchema)],
    handler: tourFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourFeatureAuditLogger],
    preValidation: [validate(tourFeatureUpdateSchema)],
    handler: tourFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourFeatureAuditLogger],
    handler: tourFeatureController.delete,
  });
}
