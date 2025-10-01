import { FastifyInstance } from "fastify"
import ActivityReservationController from "../../controllers/Admin/ActivityReservationController"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"

export default async function activityReservationRoutes(fastify: FastifyInstance) {
	const activityController = new ActivityReservationController()

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: activityController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: activityController.findOne,
	})
}
