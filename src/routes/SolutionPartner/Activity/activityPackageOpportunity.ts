import { FastifyInstance } from "fastify"
import ActivityPackageOpportunityController from "../../../controllers/SolutionPartner/Activity/ActivityPackageOpportunityController"
import { activityPackageOpportunitySchema, activityPackageOpportunityUpdateSchema, activityPackageOpportunityQuerySchema } from "../../../validators/Activity/activityPackageOpportunity"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { validate } from "../../../middlewares/validate"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import ActivityPackageOpportunityModel from "@/models/ActivityPackageOpportunityModel"

export default async function activityPackageOpportunityRoutes(fastify: FastifyInstance) {
	const activityPackageOpportunityController = new ActivityPackageOpportunityController()

	const activityPackageOpportunityAuditLogger = makeAuditLogger({
		targetName: "activity_package_opportunities",
		model: new ActivityPackageOpportunityModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityPackageOpportunityQuerySchema)],
		handler: activityPackageOpportunityController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageOpportunityController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageOpportunityController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageOpportunityAuditLogger],
		preValidation: [validate(activityPackageOpportunitySchema)],
		handler: activityPackageOpportunityController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageOpportunityAuditLogger],
		preValidation: [validate(activityPackageOpportunityUpdateSchema)],
		handler: activityPackageOpportunityController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageOpportunityAuditLogger],
		handler: activityPackageOpportunityController.delete,
	})
}
