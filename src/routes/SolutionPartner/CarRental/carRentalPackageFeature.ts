import { FastifyInstance } from "fastify";
import CarRentalPackageFeatureController from "../../../controllers/SolutionPartner/CarRental/CarRentalPackageFeatureController";
import {
  carRentalPackageFeatureSchema,
  carRentalPackageFeatureUpdateSchema,
  carRentalPackageFeatureQuerySchema,
} from "@/validators/CarRental/carRentalPackageFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CarRentalPackageFeatureModel from "@/models/CarRentalPackageFeatureModel";

export default async function carRentalPackageFeatureRoutes(
  fastify: FastifyInstance
) {
  const carRentalPackageFeatureController = new CarRentalPackageFeatureController();

  const carRentalPackageFeatureAuditLogger = makeAuditLogger({
    targetName: "car_rental_package_features",
    model: new CarRentalPackageFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(carRentalPackageFeatureQuerySchema)],
    handler: carRentalPackageFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalPackageFeatureController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalPackageFeatureController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, carRentalPackageFeatureAuditLogger],
    preValidation: [validate(carRentalPackageFeatureSchema)],
    handler: carRentalPackageFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, carRentalPackageFeatureAuditLogger],
    preValidation: [validate(carRentalPackageFeatureUpdateSchema)],
    handler: carRentalPackageFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, carRentalPackageFeatureAuditLogger],
    handler: carRentalPackageFeatureController.delete,
  });
}
