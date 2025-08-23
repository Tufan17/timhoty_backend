import { FastifyInstance } from "fastify";
import HotelRoomImageController from "../../../controllers/SolutionPartner/Hotel/HotelRoomImageController";
import { hotelRoomImageSchema, hotelRoomImageUpdateSchema, hotelRoomImageQuerySchema, hotelRoomImageBulkDeleteSchema } from "../../../validators/Hotel/hotelRoomImage";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelRoomImageModel from "@/models/HotelRoomImageModel";
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData";
import { validate } from "../../../middlewares/validate";

export default async function hotelRoomImageRoutes(fastify: FastifyInstance) {
  const hotelRoomImageController = new HotelRoomImageController();
  
  const hotelRoomImageAuditLogger = makeAuditLogger({
    targetName: "hotel_room_images",
    model: new HotelRoomImageModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelRoomImageQuerySchema)],
    handler: hotelRoomImageController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomImageController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomImageController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomImageAuditLogger],
    preValidation: [validateFormDataMultiple(hotelRoomImageSchema)],
    handler: hotelRoomImageController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomImageAuditLogger],
    preValidation: [validateFormData(hotelRoomImageUpdateSchema)],
    handler: hotelRoomImageController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomImageAuditLogger],
    handler: hotelRoomImageController.delete,
  });

  fastify.delete("/bulk", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(hotelRoomImageBulkDeleteSchema)],
    handler: hotelRoomImageController.bulkDelete,
  });
}
