import { FastifyInstance } from "fastify";
import TourProgramController from "../../../controllers/SolutionPartner/Tour/TourProgramController";
import {
  tourProgramSchema,
  tourProgramUpdateSchema,
  tourProgramQuerySchema,
} from "../../../validators/Tour/tourProgram";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import TourProgramModel from "@/models/TourProgramModel";

export default async function tourProgramRoutes(fastify: FastifyInstance) {
  const tourProgramController = new TourProgramController();

  const tourProgramAuditLogger = makeAuditLogger({
    targetName: "tour_programs",
    model: new TourProgramModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourProgramQuerySchema)],
    handler: tourProgramController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourProgramController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: tourProgramController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourProgramAuditLogger],
    preValidation: [validate(tourProgramSchema)],
    handler: tourProgramController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourProgramAuditLogger],
    preValidation: [validate(tourProgramUpdateSchema)],
    handler: tourProgramController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourProgramAuditLogger],
    handler: tourProgramController.delete,
  });
}
