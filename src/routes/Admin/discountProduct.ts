import { FastifyInstance } from "fastify"

import { authAdminMiddleware } from "../../middlewares/authAdminMiddleware"

import { makeAuditLogger } from "../../middlewares/logMiddleware"
import DiscountProductModel from "@/models/DiscountProductModel"
import { validate } from "@/middlewares/validate"

import DiscountProductController from "@/controllers/Admin/DiscountProductController"
import { discountProductSchema, discountProductUpdateSchema } from "@/validators/discountProduct"

export default async function discountProductRoutes(fastify: FastifyInstance) {
	const discountProductController = new DiscountProductController()

	const currencyAuditLogger = makeAuditLogger({
		targetName: "discount_products",
		model: new DiscountProductModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: discountProductController.dataTable,
	})
	fastify.get("/all", {
		preHandler: [authAdminMiddleware],
		handler: discountProductController.findAll,
	})
	fastify.get("/:id", {
		preHandler: [authAdminMiddleware],
		handler: discountProductController.findOne,
	})
	fastify.post("/", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		preValidation: [validate(discountProductSchema)],
		handler: discountProductController.create,
	})
	fastify.put("/:id", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		preValidation: [validate(discountProductUpdateSchema)],
		handler: discountProductController.update,
	})
	fastify.delete("/:id", {
		preHandler: [authAdminMiddleware, currencyAuditLogger],
		handler: discountProductController.delete,
	})
}
