import { FastifyInstance } from "fastify";
import CountryController from "../../controllers/SolutionPartner/CountryController";
import { citySchema, cityUpdateSchema, cityQuerySchema } from "../../validators/city";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import CityModel from "../../models/CityModel";
import { validateFormData } from "../../middlewares/validateFormData";
import { validateQuery } from "../../middlewares/validateQuery";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CountryModel from "@/models/CountryModel";

export default async function countryRoutes(fastify: FastifyInstance) {
  const countryController = new CountryController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "countries",
    model: new CountryModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });
  fastify.get("/", {
    preValidation: [validateQuery(cityQuerySchema)],
    handler: countryController.dataTable,
  });
  fastify.get("/all", {
    handler: countryController.findAll,
  });
    
    
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: countryController.findOne,
  });
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(citySchema)],
    handler: countryController.create,
  });
  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(cityUpdateSchema)],
    handler: countryController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, currencyAuditLogger],
    handler: countryController.delete,
  });
}
