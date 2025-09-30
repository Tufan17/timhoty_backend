import { FastifyInstance } from "fastify"
import VisaReservationController from "../../../controllers/SolutionPartner/Reservation/VisaReservationController"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

export default async function visaReservationRoutes(fastify: FastifyInstance) {
	const visaController = new VisaReservationController()

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaController.dataTable,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaController.findOne,
	})
}
