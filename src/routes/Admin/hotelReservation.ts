import { FastifyInstance } from "fastify"
import HotelReservationController from "../../controllers/Admin/HotelReservationController"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"

export default async function hotelReservationRoutes(fastify: FastifyInstance) {
	const hotelController = new HotelReservationController()

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: hotelController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: hotelController.findOne,
	})
}
