import { FastifyInstance } from "fastify";
import TourPackageFeatureController from "../../../controllers/SolutionPartner/Tour/TourPackageFeatureController";
import {
  tourPackageFeatureSchema,
  tourPackageFeatureUpdateSchema,
  tourPackageFeatureQuerySchema,
} from "../../../validators/Tour/tourPackageFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourPackageFeatureModel from "@/models/TourPackageFeatureModel";

export default async function hotelFeatureRoutes(fastify: FastifyInstance) {
  const tourPackageFeatureController = new TourPackageFeatureController();

  const tourPackageFeatureAuditLogger = makeAuditLogger({
    targetName: "tour_package_features",
    model: new TourPackageFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourPackageFeatureQuerySchema)],
    handler: tourPackageFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourPackageFeatureController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourPackageFeatureController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageFeatureAuditLogger],
    preValidation: [validate(tourPackageFeatureSchema)],
    handler: tourPackageFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageFeatureAuditLogger],
    preValidation: [validate(tourPackageFeatureUpdateSchema)],
    handler: tourPackageFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageFeatureAuditLogger],
    handler: tourPackageFeatureController.delete,
  });
}
