import { FastifyInstance } from "fastify"
import SolutionPartnerUserController from "../../../controllers/SolutionPartner/Worker/WorkerController"
import { authSolutionPartnerMiddleware } from "../../../middlewares/authSolutionPartnerMiddleware"
import { makeAuditLogger } from "@/middlewares/logMiddleware"
import { solutionPartnerUserSchema, solutionPartnerUserUpdateSchema } from "@/validators/solutionPartner"
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel"
import { validate } from "@/middlewares/validate"

export default async function workerRoutes(fastify: FastifyInstance) {
	const solutionPartnerUserController = new SolutionPartnerUserController()

	const solutionPartnerAuditLogger = makeAuditLogger({
		targetName: "workers",
		model: new SolutionPartnerUserModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: solutionPartnerUserController.findAll,
	})
	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: solutionPartnerUserController.findOne,
	})
	fastify.post("/", {
		preHandler: [authSolutionPartnerMiddleware, solutionPartnerAuditLogger],
		preValidation: [validate(solutionPartnerUserSchema)],
		handler: solutionPartnerUserController.create,
	})
	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, solutionPartnerAuditLogger],
		preValidation: [validate(solutionPartnerUserUpdateSchema)],
		handler: solutionPartnerUserController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, solutionPartnerAuditLogger],
		handler: solutionPartnerUserController.delete,
	})
}
