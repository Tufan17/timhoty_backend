import { FastifyInstance } from "fastify"
import IncludedExcludedController from "../../controllers/Admin/IncludedExcludedController"
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware"
import { includedExcludedSchema, includedExcludedUpdateSchema } from "@/validators/includedExcluded"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import IncludedExcludedModel from "@/models/IncludedExcludedModal"
import { validate } from "@/middlewares/validate"

export default async function includedExcludedRoutes(fastify: FastifyInstance) {
	const includedExcludedController = new IncludedExcludedController()

	const includedExcludedAuditLogger = makeAuditLogger({
		targetName: "included_excluded",
		model: new IncludedExcludedModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: includedExcludedController.findAll,
	})
	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: includedExcludedController.findOne,
	})
	fastify.post("/", {
		preHandler: [authAdminMiddleware, includedExcludedAuditLogger],
		preValidation: [validate(includedExcludedSchema)],
		handler: includedExcludedController.create,
	})
	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, includedExcludedAuditLogger],
		preValidation: [validate(includedExcludedUpdateSchema)],
		handler: includedExcludedController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authAdminMiddleware, includedExcludedAuditLogger],
		handler: includedExcludedController.delete,
	})
}
