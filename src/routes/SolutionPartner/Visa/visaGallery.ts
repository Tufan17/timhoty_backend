import { FastifyInstance } from "fastify"
import VisaGalleryController from "../../../controllers/SolutionPartner/Visa/VisaGalleryController"
import { visaGallerySchema, visaGalleryUpdateSchema, visaGalleryQuerySchema, visaGalleryBulkDeleteSchema } from "../../../validators/Visa/visaGallery"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import VisaGalleryModel from "@/models/VisaGalleryModel"
import { validateFormData, validateFormDataMultiple } from "@/middlewares/validateFormData"
import { validate } from "../../../middlewares/validate"

export default async function visaGalleryRoutes(fastify: FastifyInstance) {
	const visaGalleryController = new VisaGalleryController()

	const visaGalleryAuditLogger = makeAuditLogger({
		targetName: "visa_galleries",
		model: new VisaGalleryModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(visaGalleryQuerySchema)],
		handler: visaGalleryController.dataTable,
	})

	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaGalleryController.findAll,
	})

	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaGalleryController.findOne,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, visaGalleryAuditLogger],
		preValidation: [validateFormDataMultiple(visaGallerySchema)],
		handler: visaGalleryController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, visaGalleryAuditLogger],
		preValidation: [validateFormData(visaGalleryUpdateSchema)],
		handler: visaGalleryController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, visaGalleryAuditLogger],
		handler: visaGalleryController.delete,
	})

	fastify.delete("/bulk", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validate(visaGalleryBulkDeleteSchema)],
		handler: visaGalleryController.bulkDelete,
	})
}
