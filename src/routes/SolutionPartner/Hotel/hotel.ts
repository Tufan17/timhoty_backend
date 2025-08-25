import { FastifyInstance } from "fastify";
import HotelController from "../../../controllers/SolutionPartner/Hotel/HotelController";
import { hotelSchema, hotelUpdateSchema, hotelQuerySchema } from "../../../validators/Hotel/hotel";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelModel from "@/models/HotelModel";

export default async function hotelRoutes(fastify: FastifyInstance) {
  const hotelController = new HotelController();
  
  const hotelAuditLogger = makeAuditLogger({
    targetName: "hotels",
    model: new HotelModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });
  fastify.get("/", {
    preValidation: [validateQuery(hotelQuerySchema)],
    handler: hotelController.dataTable,
  });
  fastify.get("/all", {
    handler: hotelController.findAll,
  });
   
  fastify.post("/send-for-approval/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelController.sendForApproval,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelAuditLogger],
    preValidation: [validate(hotelSchema)],
    handler: hotelController.create,
  });
  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelAuditLogger],
    preValidation: [validate(hotelUpdateSchema)],
    handler: hotelController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelAuditLogger],
    handler: hotelController.delete,
  });
}
