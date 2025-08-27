import { FastifyInstance } from "fastify";
import CarRentalController from "../../../controllers/SolutionPartner/CarRental/CarRentalController";
import { makeAuditLogger } from "../../../middlewares/logMiddleware";
import { validateQuery } from "../../../middlewares/validateQuery";
import { validate } from "../../../middlewares/validate";
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware";
import CarRentalModel from "@/models/CarRentalModel";
import { carRentalQuerySchema } from "@/validators/CarRental/carRental";
import { carRentalSchema } from "@/validators/CarRental/carRental";
import { carRentalUpdateSchema } from "@/validators/CarRental/carRental";


export default async function carRentalRoutes(fastify: FastifyInstance) {
  const carRentalController = new CarRentalController();
  
  const carRentalAuditLogger = makeAuditLogger({
    targetName: "car_rentals",
    model: new CarRentalModel(),
    idParam: "id",
    getUser: (request) => (request as any).user || {}
  });

  fastify.get("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validateQuery(carRentalQuerySchema)],
    handler: carRentalController.dataTable,
  });
  fastify.get("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalController.findOne,
  })
  fastify.get("/all", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalController.findAll,
  });

  fastify.post("/", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(carRentalSchema)],
    handler: carRentalController.create,
  });

  fastify.put("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    preValidation: [validate(carRentalUpdateSchema)],
    handler: carRentalController.update,
  });

  fastify.delete("/:id", {
    preHandler: [authSolutionPartnerMiddleware],
    handler: carRentalController.delete,
  });
}
