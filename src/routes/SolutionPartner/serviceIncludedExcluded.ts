import { FastifyInstance } from "fastify"
import ServiceIncludedExcludedController from "../../controllers/SolutionPartner/ServiceIncludedExcludedController"
import { authSolutionPartnerMiddleware } from "../../middlewares/authSolutionPartnerMiddleware"
import { includedExcludedCreateSchema } from "@/validators/includedExcluded"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import ServiceIncludedExcludedModel from "@/models/ServiceIncludedExcludedModal"
import { validate } from "@/middlewares/validate"

export default async function serviceIncludedExcludedRoutes(fastify: FastifyInstance) {
	const serviceIncludedExcludedController = new ServiceIncludedExcludedController()

	const serviceIncludedExcludedAuditLogger = makeAuditLogger({
		targetName: "service_included_excluded",
		model: new ServiceIncludedExcludedModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: serviceIncludedExcludedController.findAll,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, serviceIncludedExcludedAuditLogger],
		preValidation: [validate(includedExcludedCreateSchema)],
		handler: serviceIncludedExcludedController.update,
	})
}
