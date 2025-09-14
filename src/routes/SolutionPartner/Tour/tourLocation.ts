import { FastifyInstance } from "fastify";
import TourLocationController from "../../../controllers/SolutionPartner/Tour/TourLocationController";
import {
  tourLocationSchema,
  tourLocationUpdateSchema,
  tourLocationQuerySchema,
} from "../../../validators/Tour/tourLocation";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourLocationModel from "@/models/TourLocationModel";

export default async function tourLocationRoutes(fastify: FastifyInstance) {
  const tourLocationController = new TourLocationController();

  const tourLocationAuditLogger = makeAuditLogger({
    targetName: "tour_locations",
    model: new TourLocationModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourLocationQuerySchema)],
    handler: tourLocationController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
        handler: tourLocationController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourLocationController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourLocationAuditLogger],
    preValidation: [validate(tourLocationSchema)],
    handler: tourLocationController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourLocationAuditLogger],
    preValidation: [validate(tourLocationUpdateSchema)],
    handler: tourLocationController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourLocationAuditLogger],
    handler: tourLocationController.delete,
  });
}
