import { FastifyInstance } from "fastify"
import VisaReservationController from "../../controllers/Admin/VisaReservationController"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"

export default async function visaReservationRoutes(fastify: FastifyInstance) {
	const visaController = new VisaReservationController()

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: visaController.dataTable,
	})

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: visaController.findOne,
	})
}
