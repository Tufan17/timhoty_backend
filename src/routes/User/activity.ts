import { FastifyInstance } from "fastify"
import ActivityController from "../../controllers/User/ActivityController"

export default async function carRentalRoutes(fastify: FastifyInstance) {
	const activityController = new ActivityController()

	fastify.get("/", {
		handler: activityController.index,
	})
	fastify.get("/types", {
		handler: activityController.activityTypes,
	})
	fastify.get("/:id", {
		handler: activityController.show,
	})
}
