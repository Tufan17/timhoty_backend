import { FastifyInstance } from "fastify";
import CountryController from "../controllers/Admin/CountryController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { countrySchema, countryUpdateSchema } from "@/validators/country";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import CountryModel from "@/models/CountryModel";
import { validateFormData } from "@/middlewares/validateFormData";

export default async function countryRoutes(fastify: FastifyInstance) {
  const countryController = new CountryController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "countries",
    model: new CountryModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: countryController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: countryController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(countrySchema)],
    handler: countryController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validateFormData(countryUpdateSchema)],
    handler: countryController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: countryController.delete,
  });
}
