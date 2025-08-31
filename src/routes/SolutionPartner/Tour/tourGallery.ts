import { FastifyInstance } from "fastify";
import TourGalleryController from "../../../controllers/SolutionPartner/Tour/TourGalleryController";
import { tourGallerySchema, tourGalleryUpdateSchema, tourGalleryQuerySchema, tourGalleryBulkDeleteSchema } from "../../../validators/Tour/tourGallery";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourGalleryModel from "@/models/TourGalleryModel";
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData";
import { validate } from "../../../middlewares/validate";

export default async function tourGalleryRoutes(fastify: FastifyInstance) {
  const tourGalleryController = new TourGalleryController();
  
  const tourGalleryAuditLogger = makeAuditLogger({
    targetName: "tour_galleries",
    model: new TourGalleryModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourGalleryQuerySchema)],
    handler: tourGalleryController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourGalleryController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourGalleryController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourGalleryAuditLogger],
    preValidation: [validateFormDataMultiple(tourGallerySchema)],
    handler: tourGalleryController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourGalleryAuditLogger],
    preValidation: [validateFormData(tourGalleryUpdateSchema)],
    handler: tourGalleryController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourGalleryAuditLogger],
    handler: tourGalleryController.delete,
  });

  fastify.delete("/bulk", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(tourGalleryBulkDeleteSchema)],
    handler: tourGalleryController.bulkDelete,
  });
}
