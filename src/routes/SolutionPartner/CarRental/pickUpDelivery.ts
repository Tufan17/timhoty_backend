import { FastifyInstance } from "fastify";
import CarPickupDeliveryController from "../../../controllers/SolutionPartner/CarRental/CarPickupDeliveryController";
import {
  pickUpDeliverySchema,
  pickUpDeliveryUpdateSchema,
  pickUpDeliveryQuerySchema,
} from "../../../validators/CarRental/pickUpDelivery";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "../../../middlewares/authSolutionPartnerMiddleware";
import CarPickupDeliveryModel from "../../../models/CarPickupDeliveryModel";

export default async function pickUpDeliveryRoutes(fastify: FastifyInstance) {
    const pickUpDeliveryController = new CarPickupDeliveryController();

  const pickUpDeliveryAuditLogger = makeAuditLogger({
    targetName: "pick_up_deliveries",
    model: new CarPickupDeliveryModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {},
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(pickUpDeliveryQuerySchema)],
    handler: pickUpDeliveryController.dataTable,
  });

  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: pickUpDeliveryController.findAll,
  });

  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: pickUpDeliveryController.findOne,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware, pickUpDeliveryAuditLogger],
    preValidation: [validate(pickUpDeliverySchema)],
    handler: pickUpDeliveryController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware, pickUpDeliveryAuditLogger],
    preValidation: [validate(pickUpDeliveryUpdateSchema)],
    handler: pickUpDeliveryController.update,
  });

  fastify.delete("/:id", {
        preHandler: [authSolutionPartnerMiddleware, pickUpDeliveryAuditLogger],
    handler: pickUpDeliveryController.delete,
  });
}
