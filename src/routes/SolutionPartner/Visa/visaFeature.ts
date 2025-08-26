import { FastifyInstance } from "fastify";
import VisaFeatureController from "../../../controllers/SolutionPartner/Visa/VisaFeatureController";
import { visaFeatureSchema, visaFeatureUpdateSchema, visaFeatureQuerySchema } from "../../../validators/Visa/visaFeature";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import VisaFeatureModel from "@/models/VisaFeatureModel";

export default async function visaFeatureRoutes(fastify: FastifyInstance) {
  const visaFeatureController = new VisaFeatureController();
  
  const visaFeatureAuditLogger = makeAuditLogger({
    targetName: "visa_features",
    model: new VisaFeatureModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(visaFeatureQuerySchema)],
    handler: visaFeatureController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: visaFeatureController.findAll,
  });
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: visaFeatureController.findOne,
  });
  
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, visaFeatureAuditLogger],
    preValidation: [validate(visaFeatureSchema)],
    handler: visaFeatureController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, visaFeatureAuditLogger],
    preValidation: [validate(visaFeatureUpdateSchema)],
    handler: visaFeatureController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, visaFeatureAuditLogger],
    handler: visaFeatureController.delete,
  });
}
