import { FastifyInstance } from "fastify";
import HotelGalleryController from "../../../controllers/SolutionPartner/Hotel/HotelGalleryController";
import { hotelGallerySchema, hotelGalleryUpdateSchema, hotelGalleryQuerySchema, hotelGalleryBulkDeleteSchema } from "../../../validators/Hotel/hotelGallery";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelGalleryModel from "@/models/HotelGalleryModel";
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData";
import { validate } from "../../../middlewares/validate";

export default async function hotelGalleryRoutes(fastify: FastifyInstance) {
  const hotelGalleryController = new HotelGalleryController();
  
  const hotelGalleryAuditLogger = makeAuditLogger({
    targetName: "hotel_galleries",
    model: new HotelGalleryModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelGalleryQuerySchema)],
    handler: hotelGalleryController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelGalleryController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelGalleryController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelGalleryAuditLogger],
    preValidation: [validateFormDataMultiple(hotelGallerySchema)],
    handler: hotelGalleryController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelGalleryAuditLogger],
    preValidation: [validateFormData(hotelGalleryUpdateSchema)],
    handler: hotelGalleryController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelGalleryAuditLogger],
    handler: hotelGalleryController.delete,
  });

  fastify.delete("/bulk", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(hotelGalleryBulkDeleteSchema)],
    handler: hotelGalleryController.bulkDelete,
  });
}
