import { FastifyInstance } from "fastify";
import TourDeparturePointController from "../../../controllers/SolutionPartner/Tour/TourDeparturePointController";
import {
  tourDeparturePointSchema,
  tourDeparturePointUpdateSchema,
  tourDeparturePointQuerySchema,
  } from "../../../validators/Tour/tourDeparturePoint";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourDeparturePointModel from "@/models/TourDeparturePointModel";

export default async function tourDeparturePointRoutes(fastify: FastifyInstance) {
  const tourDeparturePointController = new TourDeparturePointController();

  const tourDeparturePointAuditLogger = makeAuditLogger({
    targetName: "tour_departure_points",
    model: new TourDeparturePointModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourDeparturePointQuerySchema)],
    handler: tourDeparturePointController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourDeparturePointController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourDeparturePointController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourDeparturePointAuditLogger],
    preValidation: [validate(tourDeparturePointSchema)],
    handler: tourDeparturePointController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourDeparturePointAuditLogger],
    preValidation: [validate(tourDeparturePointUpdateSchema)],
    handler: tourDeparturePointController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourDeparturePointAuditLogger],
    handler: tourDeparturePointController.delete,
  });
}
