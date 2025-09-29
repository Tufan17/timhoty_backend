import { FastifyInstance } from "fastify"
import HotelReservationController from "../../../controllers/SolutionPartner/Reservation/HotelReservationController"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

export default async function hotelReservationRoutes(fastify: FastifyInstance) {
	const hotelController = new HotelReservationController()

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: hotelController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: hotelController.findOne,
	})
}
