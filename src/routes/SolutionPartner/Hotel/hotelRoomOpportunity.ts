import { FastifyInstance } from "fastify";
import HotelRoomOpportunityController from "../../../controllers/SolutionPartner/Hotel/HotelRoomOpportunityController";
import { hotelRoomOpportunitySchema, hotelRoomOpportunityUpdateSchema, hotelRoomOpportunityQuerySchema } from "@/validators/Hotel/hotelRoomOpportunity";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelRoomOpportunityModel from "@/models/HotelRoomOpportunityModel";

export default async function hotelRoomOpportunityRoutes(fastify: FastifyInstance) {
  const hotelRoomOpportunityController = new HotelRoomOpportunityController();
  
  const hotelRoomOpportunityAuditLogger = makeAuditLogger({
    targetName: "hotel_room_opportunities",
    model: new HotelRoomOpportunityModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelRoomOpportunityQuerySchema)],
    handler: hotelRoomOpportunityController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomOpportunityController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelRoomOpportunityController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomOpportunityAuditLogger],
    preValidation: [validate(hotelRoomOpportunitySchema)],
    handler: hotelRoomOpportunityController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomOpportunityAuditLogger],
    preValidation: [validate(hotelRoomOpportunityUpdateSchema)],
    handler: hotelRoomOpportunityController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelRoomOpportunityAuditLogger],
    handler: hotelRoomOpportunityController.delete,
  });
}
