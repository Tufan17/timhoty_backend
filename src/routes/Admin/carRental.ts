import { FastifyInstance } from "fastify"
import CarRentalController from "../../controllers/Admin/CarRentalController"
import { makeAuditLogger } from "@/middlewares/logMiddleware"
import { validateQuery } from "@/middlewares/validateQuery"
import { validate } from "@/middlewares/validate"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"
import CarRentalModel from "@/models/CarRentalModel"
import { carRentalQuerySchema } from "@/validators/CarRental/carRental"

import { carRentalUpdateSchema } from "@/validators/CarRental/carRental"

export default async function carRentalRoutes(fastify: FastifyInstance) {
	const carRentalController = new CarRentalController()

	const carRentalAuditLogger = makeAuditLogger({
		targetName: "car_rentals",
		model: new CarRentalModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		preValidation: [validateQuery(carRentalQuerySchema)],
		handler: carRentalController.dataTable,
	})
	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: carRentalController.findOne,
	})
	fastify.get("/all", {
		preHandler: [authAdminMiddleware],
		handler: carRentalController.findAll,
	})
	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, carRentalAuditLogger],
		preValidation: [validate(carRentalUpdateSchema)],
		handler: carRentalController.updateCarRentalApproval,
	})
}
