import { FastifyInstance } from "fastify";
import CarRentalGalleryController from "../../../controllers/SolutionPartner/CarRental/CarRentalGalleryController";
import { carRentalGallerySchema, carRentalGalleryUpdateSchema, carRentalGalleryQuerySchema, carRentalGalleryBulkDeleteSchema } from "../../../validators/CarRental/carRentalGallery";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CarRentalGalleryModel from "@/models/CarRentalGalleryModel";
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData";
import { validate } from "../../../middlewares/validate";

export default async function carRentalGalleryRoutes(fastify: FastifyInstance) {
  const carRentalGalleryController = new CarRentalGalleryController();
  
  const carRentalGalleryAuditLogger = makeAuditLogger({
    targetName: "car_rental_galleries",
    model: new CarRentalGalleryModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(carRentalGalleryQuerySchema)],
    handler: carRentalGalleryController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalGalleryController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalGalleryController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, carRentalGalleryAuditLogger],
    preValidation: [validateFormDataMultiple(carRentalGallerySchema)],
    handler: carRentalGalleryController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, carRentalGalleryAuditLogger],
    preValidation: [validateFormData(carRentalGalleryUpdateSchema)],
    handler: carRentalGalleryController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, carRentalGalleryAuditLogger],
    handler: carRentalGalleryController.delete,
  });

  fastify.delete("/bulk", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(carRentalGalleryBulkDeleteSchema)],
    handler: carRentalGalleryController.bulkDelete,
  });
}
