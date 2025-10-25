import { FastifyInstance } from "fastify"
import SalesPartnerUserController from "@/controllers/SalePartner/SalesPartnerUserController"
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware"
import { makeAuditLogger } from "@/middlewares/logMiddleware"
import { salesPartnerUserSchema, salesPartnerUserUpdateSchema } from "@/validators/salesPartner"
import SalesPartnerUserModel from "@/models/SalesPartnerUserModel"
import { validate } from "@/middlewares/validate"

export default async function workerRoutes(fastify: FastifyInstance) {
	const salesPartnerUserController = new SalesPartnerUserController()

	const salesPartnerAuditLogger = makeAuditLogger({
		targetName: "workers",
		model: new SalesPartnerUserModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSalesPartnerMiddleware],
		handler: salesPartnerUserController.findAll,
	})
	fastify.get("/:id", {
		preHandler: [authSalesPartnerMiddleware],
		handler: salesPartnerUserController.findOne,
	})
	fastify.post("/", {
		preHandler: [authSalesPartnerMiddleware, salesPartnerAuditLogger],
		preValidation: [validate(salesPartnerUserSchema)],
		handler: salesPartnerUserController.create,
	})
	fastify.put("/:id", {
		preHandler: [authSalesPartnerMiddleware, salesPartnerAuditLogger],
        preValidation: [validate(salesPartnerUserUpdateSchema)],
		handler: salesPartnerUserController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authSalesPartnerMiddleware, salesPartnerAuditLogger],
		handler: salesPartnerUserController.delete,
	})
}
