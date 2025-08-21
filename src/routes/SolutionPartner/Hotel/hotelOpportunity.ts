import { FastifyInstance } from "fastify";
import HotelOpportunityController from "../../../controllers/SolutionPartner/Hotel/HotelOpportunityController";
import { hotelOpportunitySchema, hotelOpportunityUpdateSchema, hotelOpportunityQuerySchema } from "../../../validators/Hotel/hotelOpportunity";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelOpportunityModel from "@/models/HotelOpportunityModel";

export default async function hotelOpportunityRoutes(fastify: FastifyInstance) {
  const hotelOpportunityController = new HotelOpportunityController();
  
  const hotelOpportunityAuditLogger = makeAuditLogger({
    targetName: "hotel_opportunities",
    model: new HotelOpportunityModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelOpportunityQuerySchema)],
    handler: hotelOpportunityController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelOpportunityController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelOpportunityController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelOpportunityAuditLogger],
    preValidation: [validate(hotelOpportunitySchema)],
    handler: hotelOpportunityController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelOpportunityAuditLogger],
    preValidation: [validate(hotelOpportunityUpdateSchema)],
    handler: hotelOpportunityController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelOpportunityAuditLogger],
    handler: hotelOpportunityController.delete,
  });
}
