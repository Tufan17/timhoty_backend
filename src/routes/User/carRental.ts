import { FastifyInstance } from "fastify"
import CarRentalController from "../../controllers/User/CarRentalController"

export default async function carRentalRoutes(fastify: FastifyInstance) {
	const carRentalController = new CarRentalController()

	fastify.get("/", {
		handler: carRentalController.index,
	})
	fastify.get("/car-types", {
		handler: carRentalController.carTypes,
	})
	fastify.get("/gear-types", {
		handler: carRentalController.gearTypes,
	})
	fastify.get("/:id", {
		handler: carRentalController.show,
	})
}
