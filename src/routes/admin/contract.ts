import { FastifyInstance } from "fastify";
import ContractController from "../../controllers/Admin/ContractController";
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import { contractSchema, contractUpdateSchema } from "@/validators/contract";
import { makeAuditLogger } from "../../middlewares/logMiddleware";
import ContractModel from "@/models/ContractModel";
import { validate } from "@/middlewares/validate";

export default async function contractRoutes(fastify: FastifyInstance) {
  const contractController = new ContractController();
  
  const currencyAuditLogger = makeAuditLogger({
    targetName: "contracts",
    model: new ContractModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authAdminMiddleware],
    handler: contractController.findAll,
  });
  fastify.get("/:id", {
    preHandler: [authAdminMiddleware],
    handler: contractController.findOne,
  });
  fastify.post("/", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validate(contractSchema)],
    handler: contractController.create,
  });
  fastify.put("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    preValidation: [validate(contractUpdateSchema)],
    handler: contractController.update,
  });
  fastify.delete("/:id", {
    preHandler: [authAdminMiddleware, currencyAuditLogger],
    handler: contractController.delete,
  });
}
