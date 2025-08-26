import { FastifyInstance } from "fastify";
import VisaPackageFeatureController from "../../../controllers/SolutionPartner/Visa/VisaPackageFeatureController";
import {
  visaPackageFeatureSchema,
  visaPackageFeatureUpdateSchema,
  visaPackageFeatureQuerySchema,
} from "@/validators/Visa/visaPackageFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import VisaPackageFeatureModel from "@/models/VisaPackageFeatureModel";

export default async function visaPackageFeatureRoutes(
  fastify: FastifyInstance
) {
  const visaPackageFeatureController = new VisaPackageFeatureController();

  const visaPackageFeatureAuditLogger = makeAuditLogger({
    targetName: "visa_package_features",
    model: new VisaPackageFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(visaPackageFeatureQuerySchema)],
    handler: visaPackageFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: visaPackageFeatureController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: visaPackageFeatureController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageFeatureAuditLogger],
    preValidation: [validate(visaPackageFeatureSchema)],
    handler: visaPackageFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageFeatureAuditLogger],
    preValidation: [validate(visaPackageFeatureUpdateSchema)],
    handler: visaPackageFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, visaPackageFeatureAuditLogger],
    handler: visaPackageFeatureController.delete,
  });
}
