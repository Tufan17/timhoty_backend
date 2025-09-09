import { FastifyInstance } from "fastify"
import ActivityPackageImageController from "../../../controllers/SolutionPartner/Activity/ActivityPackageImageController"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import ActivityPackageImageModel from "@/models/ActivityPackageImageModel"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { activityPackageImageSchema, activityPackageImageUpdateSchema, activityPackageImageQuerySchema } from "../../../validators/Activity/activityPackageImage"
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData"

export default async function activityPackageImageRoutes(fastify: FastifyInstance) {
	const activityPackageImageController = new ActivityPackageImageController()

	const activityPackageImageAuditLogger = makeAuditLogger({
		targetName: "activity_package_images",
		model: new ActivityPackageImageModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	// Get all images or filter by visa_package_id
	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityPackageImageQuerySchema)],
		handler: activityPackageImageController.findAll,
	})

	// Get a specific image by ID
	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: activityPackageImageController.findOne,
	})

	// Create a new image
	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageImageAuditLogger],
		preValidation: [validateFormDataMultiple(activityPackageImageSchema)],
		handler: activityPackageImageController.create,
	})

	// Update an existing image
	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageImageAuditLogger],
		preValidation: [validateFormData(activityPackageImageUpdateSchema)],
		handler: activityPackageImageController.update,
	})

	// Delete a specific image
	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageImageAuditLogger],
		handler: activityPackageImageController.delete,
	})

	// Delete all images for a specific activity package
	fastify.delete("/package/:activity_package_id", {
		preHandler: [authSolutionPartnerMiddleware, activityPackageImageAuditLogger],
		handler: activityPackageImageController.deleteByActivityPackageId,
	})
}
