import { FastifyInstance } from "fastify";
import TourPackagePriceController from "../../../controllers/SolutionPartner/Tour/TourPackagePriceController";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourPackagePriceModel from "@/models/TourPackagePriceModel";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "@/middlewares/validate";
import {
  tourPackagePriceSchema,
  tourPackagePriceUpdateSchema,
  tourPackagePriceQuerySchema,
} from "../../../validators/Tour/tourPackagePrice";

export default async function tourPackagePriceRoutes(
  fastify: FastifyInstance
) {
  const tourPackagePriceController = new TourPackagePriceController();

  const tourPackagePriceAuditLogger = makeAuditLogger({
    targetName: "tour_package_prices",
    model: new TourPackagePriceModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  // Get all prices or filter by tour_package_id
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourPackagePriceQuerySchema)],
    handler: tourPackagePriceController.findAll,
  });

  // Get a specific price by ID
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourPackagePriceController.findOne,
  });

  // Create a new price
  fastify.post("/", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackagePriceAuditLogger,
    ],
    preValidation: [validate(tourPackagePriceSchema)],
    handler: tourPackagePriceController.create,
  });

  // Update an existing price
  fastify.put("/:id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackagePriceAuditLogger,
    ],
    preValidation: [validate(tourPackagePriceUpdateSchema)],
    handler: tourPackagePriceController.update,
  });

  // Delete a specific price
  fastify.delete("/:id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackagePriceAuditLogger,
    ],
    handler: tourPackagePriceController.delete,
  });

  // Delete all prices for a specific tour package
  fastify.delete("/package/:tour_package_id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackagePriceAuditLogger,
    ],
    handler: tourPackagePriceController.deleteByTourPackageId,
  });
}

