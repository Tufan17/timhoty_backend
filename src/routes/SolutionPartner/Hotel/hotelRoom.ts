import { FastifyInstance } from "fastify";
import HotelRoomController from "../../../controllers/SolutionPartner/Hotel/HotelRoomController";
import { hotelRoomSchema, hotelRoomUpdateSchema, hotelRoomQuerySchema } from "../../../validators/Hotel/hotelRoom";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelRoomModel from "@/models/HotelRoomModel";

export default async function hotelRoomRoutes(fastify: FastifyInstance) {
  const hotelRoomController = new HotelRoomController();
  
  const hotelRoomAuditLogger = makeAuditLogger({
    targetName: "hotel_rooms",
    model: new HotelRoomModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelRoomQuerySchema)],
    handler: hotelRoomController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomAuditLogger],
    preValidation: [validate(hotelRoomSchema)],
    handler: hotelRoomController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomAuditLogger],
    preValidation: [validate(hotelRoomUpdateSchema)],
    handler: hotelRoomController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomAuditLogger],
    handler: hotelRoomController.delete,
  });
}
