import { FastifyInstance } from "fastify"
import TourReservationController from "../../../controllers/SolutionPartner/Reservation/TourReservationController"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

export default async function tourReservationRoutes(fastify: FastifyInstance) {
	const tourReservationController = new TourReservationController()

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: tourReservationController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: tourReservationController.findOne,
	})
}
