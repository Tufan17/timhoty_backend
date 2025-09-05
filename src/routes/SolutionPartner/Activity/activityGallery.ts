import { FastifyInstance } from "fastify"
import ActivityGalleryController from "../../../controllers/SolutionPartner/Activity/ActivityGalleryController"
import { activityGallerySchema, activityGalleryUpdateSchema, activityGalleryQuerySchema, activityGalleryBulkDeleteSchema } from "../../../validators/Activity/activityGallery"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData"
import { validate } from "../../../middlewares/validate"
import ActivityGalleryModel from "@/models/ActivityGalleryModel"

export default async function activityGalleryRoutes(fastify: FastifyInstance) {
	const activityGalleryController = new ActivityGalleryController()

	const activityGalleryAuditLogger = makeAuditLogger({
		targetName: "activity_galleries",
		model: new ActivityGalleryModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityGalleryQuerySchema)],
		handler: activityGalleryController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityGalleryController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityGalleryController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityGalleryAuditLogger],
		preValidation: [validateFormDataMultiple(activityGallerySchema)],
		handler: activityGalleryController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityGalleryAuditLogger],
		preValidation: [validateFormData(activityGalleryUpdateSchema)],
		handler: activityGalleryController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityGalleryAuditLogger],
		handler: activityGalleryController.delete,
	})

	fastify.delete("/bulk", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validate(activityGalleryBulkDeleteSchema)],
		handler: activityGalleryController.bulkDelete,
	})
}
