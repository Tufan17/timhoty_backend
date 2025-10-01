import { FastifyInstance } from "fastify"
import ActivityReservationController from "../../../controllers/SolutionPartner/Reservation/ActivityReservationController"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

export default async function activityReservationRoutes(fastify: FastifyInstance) {
	const activityController = new ActivityReservationController()

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityController.dataTable,
	})
	// fastify.get("/all", {
	//   handler: hotelController.findAll,
	// });

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityController.findOne,
	})
}
