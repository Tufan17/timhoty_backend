import { FastifyInstance } from "fastify"
import VisaController from "../../../controllers/SolutionPartner/Visa/VisaController"
import { visaSchema, visaUpdateSchema, visaQuerySchema } from "../../../validators/Visa/visa"
import { makeAuditLogger } from "../../../middlewares/logMiddleware"
import { validateQuery } from "../../../middlewares/validateQuery"
import { validate } from "../../../middlewares/validate"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import VisaModel from "@/models/VisaModel"

export default async function visaRoutes(fastify: FastifyInstance) {
	const visaController = new VisaController()

	const visaAuditLogger = makeAuditLogger({
		targetName: "visas",
		model: new VisaModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(visaQuerySchema)],
		handler: visaController.dataTable,
	})
	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaController.findOne,
	})
	fastify.get("/all", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaController.findAll,
	})

	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validate(visaSchema)],
		handler: visaController.create,
	})

	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validate(visaUpdateSchema)],
		handler: visaController.update,
	})

	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaController.delete,
	})

	fastify.post("/send-for-approval/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: visaController.sendForApproval,
	})
}
