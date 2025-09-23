import { FastifyInstance } from "fastify"
import VisaController from "../../controllers/User/VisaController"

export default async function visaRoutes(fastify: FastifyInstance) {
	const visaController = new VisaController()

	fastify.get("/", {
		handler: visaController.index,
	})
	fastify.get("/:id", {
		handler: visaController.show,
	})
}
