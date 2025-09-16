import { FastifyInstance } from "fastify"
import HotelController from "../../controllers/Admin/HotelController"
import { hotelSchema, hotelUpdateSchema, hotelQuerySchema } from "../../validators/Hotel/hotel"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import { validateQuery } from "../../middlewares/validateQuery"
import { validate } from "../../middlewares/validate"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"
import HotelModel from "@/models/HotelModel"

export default async function hotelRoutes(fastify: FastifyInstance) {
	const hotelController = new HotelController()

	const hotelAuditLogger = makeAuditLogger({
		targetName: "hotels",
		model: new HotelModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})
	fastify.get("/", {
		preValidation: [validateQuery(hotelQuerySchema)],
		handler: hotelController.dataTable,
	})
	fastify.get("/all", {
		handler: hotelController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: hotelController.findOne,
	})

	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, hotelAuditLogger],
		preValidation: [validate(hotelUpdateSchema)],
		handler: hotelController.updateAdminApproval,
	})
}
