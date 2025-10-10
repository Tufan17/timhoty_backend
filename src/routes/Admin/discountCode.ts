import { FastifyInstance } from "fastify"

import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware"
import { discountCodeSchema, discountCodeUpdateSchema } from "@/validators/discount"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import DiscountCodeModel from "@/models/DiscountCodeModel"
import { validate } from "@/middlewares/validate"
import DiscountCodeController from "@/controllers/Admin/DiscountCodeController"

export default async function discountCodeRoutes(fastify: FastifyInstance) {
	const discountCodeController = new DiscountCodeController()

	const currencyAuditLogger = makeAuditLogger({
		targetName: "discount_codes",
		model: new DiscountCodeModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: discountCodeController.findAll,
	})
	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: discountCodeController.findOne,
	})
	fastify.post("/", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		preValidation: [validate(discountCodeSchema)],
		handler: discountCodeController.create,
	})
	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		preValidation: [validate(discountCodeUpdateSchema)],
		handler: discountCodeController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		handler: discountCodeController.delete,
	})
}
