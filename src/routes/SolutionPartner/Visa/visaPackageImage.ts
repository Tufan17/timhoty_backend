import { FastifyInstance } from "fastify";
import VisaPackageImageController from "../../../controllers/SolutionPartner/Visa/VisaPackageImageController";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import VisaPackageImageModel from "@/models/VisaPackageImageModel";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { visaPackageImageSchema, visaPackageImageUpdateSchema, visaPackageImageQuerySchema } from "../../../validators/Visa/visaPackageImage";
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData";

export default async function visaPackageImageRoutes(fastify: FastifyInstance) {
  const visaPackageImageController = new VisaPackageImageController();
  
  const visaPackageImageAuditLogger = makeAuditLogger({
    targetName: "visa_package_images",
    model: new VisaPackageImageModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  // Get all images or filter by visa_package_id
  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(visaPackageImageQuerySchema)],
    handler: visaPackageImageController.findAll,
  });

  // Get a specific image by ID
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: visaPackageImageController.findOne,
  });

  // Create a new image
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageImageAuditLogger],
    preValidation: [validateFormDataMultiple(visaPackageImageSchema)],
    handler: visaPackageImageController.create,
  });

  // Update an existing image
  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageImageAuditLogger],
    preValidation: [validateFormData(visaPackageImageUpdateSchema)],
    handler: visaPackageImageController.update,
  });

  // Delete a specific image
  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageImageAuditLogger],
    handler: visaPackageImageController.delete,
  });

  // Delete all images for a specific visa package
  fastify.delete("/package/:visa_package_id", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageImageAuditLogger],
    handler: visaPackageImageController.deleteByVisaPackageId,
  });
} 