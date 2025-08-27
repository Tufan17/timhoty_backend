import { FastifyInstance } from "fastify";
import CarRentalFeatureController from "../../../controllers/SolutionPartner/CarRental/CarRentalFeatureController";
import {
  carRentalFeatureSchema,
  carRentalFeatureUpdateSchema,
  carRentalFeatureQuerySchema,
} from "../../../validators/CarRental/carRentalFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CarRentalFeatureModel from "@/models/CarRentalFeatureModel";

export default async function carRentalFeatureRoutes(fastify: FastifyInstance) {
  const carRentalFeatureController = new CarRentalFeatureController();

  const carRentalFeatureAuditLogger = makeAuditLogger({
    targetName: "car_rental_features",
    model: new CarRentalFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(carRentalFeatureQuerySchema)],
    handler: carRentalFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalFeatureController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalFeatureController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, carRentalFeatureAuditLogger],
    preValidation: [validate(carRentalFeatureSchema)],
    handler: carRentalFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, carRentalFeatureAuditLogger],
    preValidation: [validate(carRentalFeatureUpdateSchema)],
    handler: carRentalFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, carRentalFeatureAuditLogger],
    handler: carRentalFeatureController.delete,
  });
}
