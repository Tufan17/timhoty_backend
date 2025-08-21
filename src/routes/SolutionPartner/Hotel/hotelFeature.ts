import { FastifyInstance } from "fastify";
import HotelFeatureController from "../../../controllers/SolutionPartner/HotelFeatureController";
import { hotelFeatureSchema, hotelFeatureUpdateSchema, hotelFeatureQuerySchema } from "../../../validators/Hotel/hotel";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import HotelFeatureModel from "@/models/HotelFeatureModel";

export default async function hotelFeatureRoutes(fastify: FastifyInstance) {
  const hotelFeatureController = new HotelFeatureController();
  
  const hotelFeatureAuditLogger = makeAuditLogger({
    targetName: "hotel_features",
    model: new HotelFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(hotelFeatureQuerySchema)],
    handler: hotelFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelFeatureController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: hotelFeatureController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, hotelFeatureAuditLogger],
    preValidation: [validate(hotelFeatureSchema)],
    handler: hotelFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelFeatureAuditLogger],
    preValidation: [validate(hotelFeatureUpdateSchema)],
    handler: hotelFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, hotelFeatureAuditLogger],
    handler: hotelFeatureController.delete,
  });
}
