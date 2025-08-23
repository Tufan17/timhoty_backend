import { FastifyInstance } from "fastify";
import HotelRoomFeatureController from "../../../controllers/SolutionPartner/Hotel/HotelRoomFeatureController";
import { hotelRoomFeatureSchema, hotelRoomFeatureUpdateSchema, hotelRoomFeatureQuerySchema } from "@/validators/Hotel/hotelRoomFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelRoomFeatureModel from "@/models/HotelRoomFeatureModel";

export default async function hotelRoomFeatureRoutes(fastify: FastifyInstance) {
  const hotelRoomFeatureController = new HotelRoomFeatureController();
  
  const hotelRoomFeatureAuditLogger = makeAuditLogger({
    targetName: "hotel_room_features",
    model: new HotelRoomFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelRoomFeatureQuerySchema)],
    handler: hotelRoomFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomFeatureController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomFeatureController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomFeatureAuditLogger],
    preValidation: [validate(hotelRoomFeatureSchema)],
    handler: hotelRoomFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomFeatureAuditLogger],
    preValidation: [validate(hotelRoomFeatureUpdateSchema)],
    handler: hotelRoomFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomFeatureAuditLogger],
    handler: hotelRoomFeatureController.delete,
  });
}
