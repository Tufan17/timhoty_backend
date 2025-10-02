import { FastifyInstance } from "fastify"
import CarRentalReservationController from "../../../controllers/SolutionPartner/Reservation/CarRentalReservationController"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

export default async function carRentalReservationRoutes(fastify: FastifyInstance) {
	const carRentalReservationController = new CarRentalReservationController()

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: carRentalReservationController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: carRentalReservationController.findOne,
	})
}
