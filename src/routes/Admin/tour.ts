import { FastifyInstance } from "fastify"
import TourController from "../../controllers/Admin/TourController"
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware"
import { tourUpdateSchema } from "@/validators/Tour/tour"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import TourModel from "@/models/TourModel"
import { validate } from "@/middlewares/validate"

export default async function tourRoutes(fastify: FastifyInstance) {
	const tourController = new TourController()

	const tourAuditLogger = makeAuditLogger({
		targetName: "tours",
		model: new TourModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: tourController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authAdminMiddleware],
		handler: tourController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: tourController.findOne,
	})

	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, tourAuditLogger],
		preValidation: [validate(tourUpdateSchema)],
		handler: tourController.updateTourApproval,
	})
}
