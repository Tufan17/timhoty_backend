import { FastifyInstance } from "fastify"
import { makeAuditLogger } from "@/middlewares/logMiddleware"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import { validateQuery } from "@/middlewares/validateQuery"
import { validate } from "@/middlewares/validate"

import { activityPackageHourSchema, activityPackageQuerySchema, activityPackageSchema, activityPackageUpdateSchema } from "@/validators/Activity/activityPackage"

import { ActivityPackageController } from "@/controllers/SolutionPartner/Activity/ActivityPackageController"
import ActivityPackageModel from "@/models/ActivityPackageModel"
import ActivityPackageHourModel from "@/models/ActivityPackageHourModel"

export default async function activityPackageRoutes(fastify: FastifyInstance) {
	const controller = new ActivityPackageController()

	const activityPackageAuditLogger = makeAuditLogger({
		targetName: "activity_packages",
		model: new ActivityPackageModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	const activityPackageHourAuditLogger = makeAuditLogger({
		targetName: "activity_package_hours",
		model: new ActivityPackageHourModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityPackageQuerySchema)],
		handler: controller.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: controller.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: controller.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageAuditLogger],
		preValidation: [validate(activityPackageSchema)],
		handler: controller.create,
	})

	fastify.post("/:id/create-package-hour", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageHourAuditLogger],
		preValidation: [validate(activityPackageHourSchema)],
		handler: controller.createPackageHour,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageAuditLogger],
		preValidation: [validate(activityPackageUpdateSchema)],
		handler: controller.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageAuditLogger],
		handler: controller.delete,
	})
}
