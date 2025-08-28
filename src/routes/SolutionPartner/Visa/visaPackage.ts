import { FastifyInstance } from "fastify";
import { VisaPackageController } from "../../../controllers/SolutionPartner/Visa/VisaPackageController";
import { visaPackageQuerySchema, visaPackageSchema, visaPackageUpdateSchema } from "../../../validators/Visa/VisaPackage";
import { makeAuditLogger } from "@/middlewares/logMiddleware";
import VisaPackageModel from "@/models/VisaPackageModel";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import { validateQuery } from "@/middlewares/validateQuery";
import { validate } from "@/middlewares/validate";

export default async function (fastify: FastifyInstance) {
    const controller = new VisaPackageController();

    const visaPackageAuditLogger = makeAuditLogger({
        targetName: "visa_packages",
        model: new VisaPackageModel(),
        idParam: "id",
        getUser: (request) => (request as any).user || {}
      });
      fastify.get("/", {
        preHandler: [authSolutionPartnerMiddleware],
        preValidation: [validateQuery(visaPackageQuerySchema)],
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
        preHandler: [authSolutionPartnerMiddleware, visaPackageAuditLogger],
        preValidation: [validate(visaPackageSchema)],
        handler: controller.create,
      });
    
      fastify.put("/:id", {
        preHandler: [authSolutionPartnerMiddleware, visaPackageAuditLogger],
        preValidation: [validate(visaPackageUpdateSchema)],
        handler: controller.update,
      });
    
      fastify.delete("/:id", {
        preHandler: [authSolutionPartnerMiddleware, visaPackageAuditLogger],
        handler: controller.delete,
      });
}
