import { FastifyInstance } from "fastify";
import { TourPackageController } from "../../../controllers/SolutionPartner/Tour/TourPackageController";
import { makeAuditLogger } from "@/middlewares/logMiddleware";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import { validateQuery } from "@/middlewares/validateQuery";
import { validate } from "@/middlewares/validate";
import TourPackageModel from "@/models/TourPackageModel";
import { tourPackageQuerySchema } from "@/validators/Tour/tourPackage";
import { tourPackageSchema } from "@/validators/Tour/tourPackage";
import { tourPackageUpdateSchema } from "@/validators/Tour/tourPackage";

export default async function tourPackageRoutes(fastify: FastifyInstance) {
  const controller = new TourPackageController();

  const tourPackageAuditLogger = makeAuditLogger({
    targetName: "tour_packages",
    model: new TourPackageModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(tourPackageQuerySchema)],
    handler: controller.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: controller.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: controller.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageAuditLogger],
    preValidation: [validate(tourPackageSchema)],
    handler: controller.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageAuditLogger],
    preValidation: [validate(tourPackageUpdateSchema)],
    handler: controller.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, tourPackageAuditLogger],
    handler: controller.delete,
  });
}
