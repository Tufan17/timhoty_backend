import { FastifyInstance } from "fastify"
import CarRentalReservationController from "../../controllers/Admin/CarRentalReservationController"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"

export default async function carRentalReservationRoutes(fastify: FastifyInstance) {
	const carRentalReservationController = new CarRentalReservationController()

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: carRentalReservationController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: carRentalReservationController.findOne,
	})
}
