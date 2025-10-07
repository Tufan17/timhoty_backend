import { FastifyInstance } from "fastify"
import StationController from "../../controllers/Admin/StationController"
import { stationUpdateSchema, stationQuerySchema } from "../../validators/CarRental/station"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import { validateQuery } from "../../middlewares/validateQuery"
import { validate } from "../../middlewares/validate"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"
import StationModel from "@/models/StationModel"

export default async function stationRoutes(fastify: FastifyInstance) {
	const stationController = new StationController()

	const stationAuditLogger = makeAuditLogger({
		targetName: "stations",
		model: new StationModel(),
		idParam: "id",
		getUser: (request: any) => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		preValidation: [validateQuery(stationQuerySchema)],
		handler: stationController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authAdminMiddleware],
		handler: stationController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: stationController.findOne,
	})

	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, stationAuditLogger],
		preValidation: [validate(stationUpdateSchema)],
		handler: stationController.update,
	})
}
