import { FastifyInstance } from "fastify";
import CityController from "../../controllers/SolutionPartner/CityController";
import { citySchema, cityUpdateSchema, cityQuerySchema } from "../../validators/city";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import CityModel from "../../models/CityModel";
import { validateFormData } from "../../middlewares/validateFormData";
import { validateQuery } from "../../middlewares/validateQuery";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";

export default async function cityRoutes(fastify: FastifyInstance) {
  const cityController = new CityController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "cities",
    model: new CityModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });
  fastify.get("/", {
    preValidation: [validateQuery(cityQuerySchema)],
    handler: cityController.dataTable,
  });
  fastify.get("/all", {
    handler: cityController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: cityController.findOne,
  });
  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(citySchema)],
    handler: cityController.create,
  });
  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(cityUpdateSchema)],
    handler: cityController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware, currencyAuditLogger],
    handler: cityController.delete,
  });
}
