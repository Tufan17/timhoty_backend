import { FastifyInstance } from "fastify"
import ActivityController from "../../../controllers/SolutionPartner/Activity/ActivityController"
import { activitySchema, activityUpdateSchema, activityQuerySchema } from "../../../validators/Activity/activity"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { validate } from "../../../middlewares/validate"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
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

	fastify.post("/send-for-approval/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityController.sendForApproval,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityAuditLogger],
		preValidation: [validate(activitySchema)],
		handler: activityController.create,
	})
	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityAuditLogger],
		preValidation: [validate(activityUpdateSchema)],
		handler: activityController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityAuditLogger],
		handler: activityController.delete,
	})
}
