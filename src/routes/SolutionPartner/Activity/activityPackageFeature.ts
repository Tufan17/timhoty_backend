import { FastifyInstance } from "fastify"
import ActivityPackageFeatureController from "../../../controllers/SolutionPartner/Activity/ActivityPackageFeatureController"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { validate } from "../../../middlewares/validate"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import ActivityPackageFeatureModel from "@/models/ActivityPackageFeatureModel"
import { activityPackageFeatureQuerySchema, activityPackageFeatureSchema, activityPackageFeatureUpdateSchema } from "@/validators/Activity/activityPackageFeature"

export default async function activityPackageFeatureRoutes(fastify: FastifyInstance) {
	const activityPackageFeatureController = new ActivityPackageFeatureController()

	const activityPackageFeatureAuditLogger = makeAuditLogger({
		targetName: "activity_package_features",
		model: new ActivityPackageFeatureModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityPackageFeatureQuerySchema)],
		handler: activityPackageFeatureController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageFeatureController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageFeatureController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageFeatureAuditLogger],
		preValidation: [validate(activityPackageFeatureSchema)],
		handler: activityPackageFeatureController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageFeatureAuditLogger],
		preValidation: [validate(activityPackageFeatureUpdateSchema)],
		handler: activityPackageFeatureController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageFeatureAuditLogger],
		handler: activityPackageFeatureController.delete,
	})
}
