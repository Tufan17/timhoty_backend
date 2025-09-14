import { FastifyInstance } from "fastify"
import ActivityPackageHourController from "../../../controllers/SolutionPartner/Activity/ActivityPackageHourController"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { validate } from "../../../middlewares/validate"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import ActivityPackageHourModel from "@/models/ActivityPackageHourModel"
import { activityPackageHourQuerySchema, activityPackageHourSchema, activityPackageHourUpdateSchema } from "@/validators/Activity/activityPackageHour"

export default async function activityPackageHourRoutes(fastify: FastifyInstance) {
	const activityPackageHourController = new ActivityPackageHourController()

	const activityPackageHourAuditLogger = makeAuditLogger({
		targetName: "activity_package_hours",
		model: new ActivityPackageHourModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityPackageHourQuerySchema)],
		handler: activityPackageHourController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageHourController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageHourController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageHourAuditLogger],
		preValidation: [validate(activityPackageHourSchema)],
		handler: activityPackageHourController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageHourAuditLogger],
		preValidation: [validate(activityPackageHourUpdateSchema)],
		handler: activityPackageHourController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageHourAuditLogger],
		handler: activityPackageHourController.delete,
	})
}
