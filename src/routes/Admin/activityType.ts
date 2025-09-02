import { FastifyInstance } from "fastify"
import ActivityTypeController from "../../controllers/Admin/ActivityTypeController"
import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware"
import { activityTypeSchema, activityTypeUpdateSchema } from "@/validators/Activity/activityTypes"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import ActivityTypeModel from "@/models/ActivityTypeModel"
import { validateFormData } from "@/middlewares/validateFormData"

export default async function activityTypeRoutes(fastify: FastifyInstance) {
	const activityTypeController = new ActivityTypeController()

	const currencyAuditLogger = makeAuditLogger({
		targetName: "activity_types",
		model: new ActivityTypeModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: activityTypeController.findAll,
	})
	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: activityTypeController.findOne,
	})
	fastify.post("/", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		preValidation: [validateFormData(activityTypeSchema)],
		handler: activityTypeController.create,
	})
	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		preValidation: [validateFormData(activityTypeUpdateSchema)],
		handler: activityTypeController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		handler: activityTypeController.delete,
	})
}
