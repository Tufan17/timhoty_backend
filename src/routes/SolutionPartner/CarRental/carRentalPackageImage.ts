import { FastifyInstance } from "fastify";
import CarRentalPackageImageController from "../../../controllers/SolutionPartner/CarRental/CarRentalPackageImageController";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CarRentalPackageImageModel from "@/models/CarRentalPackageImageModel";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import {
  carRentalPackageImageSchema,
  carRentalPackageImageUpdateSchema,
  carRentalPackageImageQuerySchema,
} from "../../../validators/CarRental/carRentalPackageImage";
import {
  validateFormData,
  validateFormDataMultiple,
} from "@/middlewares/validateFormData";

export default async function carRentalPackageImageRoutes(
  fastify: FastifyInstance
) {
  const carRentalPackageImageController = new CarRentalPackageImageController();

  const carRentalPackageImageAuditLogger = makeAuditLogger({
    targetName: "car_rental_package_images",
    model: new CarRentalPackageImageModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  // Get all images or filter by visa_package_id
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(carRentalPackageImageQuerySchema)],
    handler: carRentalPackageImageController.findAll,
  });

  // Get a specific image by ID
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalPackageImageController.findOne,
  });

  // Create a new image
  fastify.post("/", {
    preHandler: [
      authSolutionPartnerMiddleware,
      carRentalPackageImageAuditLogger,
    ],
    preValidation: [validateFormDataMultiple(carRentalPackageImageSchema)],
    handler: carRentalPackageImageController.create,
  });

  // Update an existing image
  fastify.put("/:id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      carRentalPackageImageAuditLogger,
    ],
    preValidation: [validateFormData(carRentalPackageImageUpdateSchema)],
    handler: carRentalPackageImageController.update,
  });

  // Delete a specific image
  fastify.delete("/:id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      carRentalPackageImageAuditLogger,
    ],
    handler: carRentalPackageImageController.delete,
  });

  // Delete all images for a specific car rental package
  fastify.delete("/package/:car_rental_package_id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      carRentalPackageImageAuditLogger,
    ],
    handler: carRentalPackageImageController.deleteByCarRentalPackageId,
  });
}
