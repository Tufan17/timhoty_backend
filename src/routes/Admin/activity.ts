import { FastifyInstance } from "fastify"
import ActivityController from "@/controllers/Admin/ActivityController"
import { activityUpdateSchema, activityQuerySchema } from "@/validators/Activity/activity"
import { makeAuditLogger } from "@/middlewares/logMiddleware"
import { validateQuery } from "@/middlewares/validateQuery"
import { validate } from "@/middlewares/validate"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"
import ActivityModel from "@/models/ActivityModel"

export default async function activityRoutes(fastify: FastifyInstance) {
	const activityController = new ActivityController()

	const activityAuditLogger = makeAuditLogger({
		targetName: "activities",
		model: new ActivityModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})
	fastify.get("/", {
		preValidation: [validateQuery(activityQuerySchema)],
		handler: activityController.dataTable,
	})
	fastify.get("/all", {
		handler: activityController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: activityController.findOne,
	})

	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, activityAuditLogger],
		preValidation: [validate(activityUpdateSchema)],
		handler: activityController.updateActivityApproval,
	})
	fastify.put("/:id/highlight", {
		preHandler: [authAdminMiddleware, activityAuditLogger],
		preValidation: [validate(activityUpdateSchema)],
		handler: activityController.updateActivityHighlight,
	})
}
