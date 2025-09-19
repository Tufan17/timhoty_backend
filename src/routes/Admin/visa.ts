import { FastifyInstance } from "fastify"
import VisaController from "../../controllers/Admin/VisaController"
import { visaUpdateSchema, visaQuerySchema } from "../../validators/Visa/visa"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import { validateQuery } from "../../middlewares/validateQuery"
import { validate } from "../../middlewares/validate"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"
import VisaModel from "@/models/VisaModel"

export default async function visaRoutes(fastify: FastifyInstance) {
	const visaController = new VisaController()

	const visaAuditLogger = makeAuditLogger({
		targetName: "visas",
		model: new VisaModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		preValidation: [validateQuery(visaQuerySchema)],
		handler: visaController.dataTable,
	})
	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: visaController.findOne,
	})
	fastify.get("/all", {
		preHandler: [authAdminMiddleware],
		handler: visaController.findAll,
	})

	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, visaAuditLogger],
		preValidation: [validate(visaUpdateSchema)],
		handler: visaController.updateVisaApproval,
	})
}
