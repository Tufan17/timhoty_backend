import { FastifyInstance } from "fastify";
import StationController from "../../../controllers/SolutionPartner/CarRental/StationController";
import {
  stationSchema,
  stationUpdateSchema,
  stationQuerySchema,
} from "../../../validators/CarRental/station";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import StationModel from "@/models/StationModel";

export default async function stationRoutes(fastify: FastifyInstance) {
  const stationController = new StationController();

  const stationAuditLogger = makeAuditLogger({
    targetName: "stations",
    model: new StationModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(stationQuerySchema)],
    handler: stationController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: stationController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: stationController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, stationAuditLogger],
    preValidation: [validate(stationSchema)],
    handler: stationController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, stationAuditLogger],
    preValidation: [validate(stationUpdateSchema)],
    handler: stationController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, stationAuditLogger],
    handler: stationController.delete,
  });
}
