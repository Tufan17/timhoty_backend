import { FastifyInstance } from "fastify";
import CityController from "../controllers/Admin/CityController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { citySchema, cityUpdateSchema, cityQuerySchema } from "../validators/city";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import CityModel from "../models/CityModel";
import { validateFormData } from "../middlewares/validateFormData";
import { validateQuery } from "../middlewares/validateQuery";

export default async function cityRoutes(fastify: FastifyInstance) {
  const cityController = new CityController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "cities",
    model: new CityModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });
  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    preValidation: [validateQuery(cityQuerySchema)],
    handler: cityController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: cityController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(citySchema)],
    handler: cityController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(cityUpdateSchema)],
    handler: cityController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: cityController.delete,
  });
}
