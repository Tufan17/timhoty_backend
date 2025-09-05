import { FastifyInstance } from "fastify"
import ActivityFeatureController from "../../../controllers/SolutionPartner/Activity/ActivityFeatureController"
import { activityFeatureQuerySchema, activityFeatureSchema, activityFeatureUpdateSchema } from "../../../validators/Activity/activityFeature"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { validate } from "../../../middlewares/validate"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

import ActivityFeatureModel from "@/models/ActivityFeatureModel"

export default async function activityFeatureRoutes(fastify: FastifyInstance) {
	const activityFeatureController = new ActivityFeatureController()

	const activityFeatureAuditLogger = makeAuditLogger({
		targetName: "activity_features",
		model: new ActivityFeatureModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityFeatureQuerySchema)],
		handler: activityFeatureController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityFeatureController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityFeatureController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityFeatureAuditLogger],
		preValidation: [validate(activityFeatureSchema)],
		handler: activityFeatureController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityFeatureAuditLogger],
		preValidation: [validate(activityFeatureUpdateSchema)],
		handler: activityFeatureController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityFeatureAuditLogger],
		handler: activityFeatureController.delete,
	})
}
