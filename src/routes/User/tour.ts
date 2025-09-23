import { FastifyInstance } from "fastify"
import TourController from "../../controllers/User/TourController"

export default async function tourRoutes(fastify: FastifyInstance) {
	const tourController = new TourController()

	fastify.get("/", {
		handler: tourController.index,
	})
	fastify.get("/:id", {
		handler: tourController.show,
	})
}
