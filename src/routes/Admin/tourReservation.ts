import { FastifyInstance } from "fastify"
import TourReservationController from "../../controllers/Admin/TourReservationController"
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware"

export default async function tourReservationRoutes(fastify: FastifyInstance) {
	const tourReservationController = new TourReservationController()

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: tourReservationController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: tourReservationController.findOne,
	})
}
