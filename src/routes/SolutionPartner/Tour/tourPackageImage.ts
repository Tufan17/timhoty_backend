import { FastifyInstance } from "fastify";
  import TourPackageImageController from "../../../controllers/SolutionPartner/Tour/TourPackageImageController";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourPackageImageModel from "@/models/TourPackageImageModel";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import {
  tourPackageImageSchema,
  tourPackageImageUpdateSchema,
  tourPackageImageQuerySchema,
} from "../../../validators/Tour/tourPackageImage";
import {
  validateFormData,
  validateFormDataMultiple,
} from "@/middlewares/validateFormData";

export default async function tourPackageImageRoutes(
  fastify: FastifyInstance
) {
  const tourPackageImageController = new TourPackageImageController();

  const tourPackageImageAuditLogger = makeAuditLogger({
      targetName: "tour_package_images",
    model: new TourPackageImageModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  // Get all images or filter by visa_package_id
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourPackageImageQuerySchema)],
    handler: tourPackageImageController.findAll,
  });

  // Get a specific image by ID
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourPackageImageController.findOne,
  });

  // Create a new image
  fastify.post("/", {
    preHandler: [
      authSolutionPartnerMiddleware,
          tourPackageImageAuditLogger,
    ],
    preValidation: [validateFormDataMultiple(tourPackageImageSchema)],
    handler: tourPackageImageController.create,
  });

  // Update an existing image
  fastify.put("/:id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackageImageAuditLogger,
    ],
    preValidation: [validateFormData(tourPackageImageUpdateSchema)],
    handler: tourPackageImageController.update,
  });

  // Delete a specific image
  fastify.delete("/:id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackageImageAuditLogger,
    ],
    handler: tourPackageImageController.delete,
  });

  // Delete all images for a specific tour package
  fastify.delete("/package/:tour_package_id", {
    preHandler: [
      authSolutionPartnerMiddleware,
      tourPackageImageAuditLogger,
    ],
    handler: tourPackageImageController.deleteByTourPackageId,
  });
}
