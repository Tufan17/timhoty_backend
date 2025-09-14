import { FastifyInstance } from "fastify";
import TourController from "../../../controllers/SolutionPartner/Tour/TourController";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourModel from "@/models/TourModel";
import { tourQuerySchema } from "@/validators/Tour/tour";
import { tourSchema } from "@/validators/Tour/tour";
import { tourUpdateSchema } from "@/validators/Tour/tour";

export default async function tourRoutes(fastify: FastifyInstance) {
  const tourController = new TourController();
  
  const tourAuditLogger = makeAuditLogger({
    targetName: "tours",
    model: new TourModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourQuerySchema)],
    handler: tourController.dataTable,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourController.findOne,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourController.findAll,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(tourSchema)],
    handler: tourController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(tourUpdateSchema)],
    handler: tourController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourController.delete,
  });
}
