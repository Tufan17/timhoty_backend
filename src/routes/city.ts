import { FastifyInstance } from "fastify";
import CityController from "../controllers/Admin/CityController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { citySchema, cityUpdateSchema } from "../validators/city";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import CityModel from "../models/CityModel";
import { validate } from "../middlewares/validate";

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
    handler: cityController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: cityController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validate(citySchema)],
    handler: cityController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validate(cityUpdateSchema)],
    handler: cityController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: cityController.delete,
  });
}
