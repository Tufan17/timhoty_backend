import { FastifyInstance } from "fastify";
import CurrencyController from "../controllers/Admin/CurrencyController";
import { authAdminMiddleware } from "../middlewares/authAdminMiddleware";
import { validate } from "../middlewares/validate";
import { currencySchema, currencyUpdateSchema } from "@/validators/currency";
import { makeAuditLogger } from "../middlewares/logMiddleware";
import CurrencyModel from "@/models/CurrencyModel";

export default async function currencyRoutes(fastify: FastifyInstance) {
  const currencyController = new CurrencyController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "currencies",
    model: new CurrencyModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: currencyController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: currencyController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validate(currencySchema)],
    handler: currencyController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validate(currencyUpdateSchema)],
    handler: currencyController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: currencyController.delete,
  });
}
