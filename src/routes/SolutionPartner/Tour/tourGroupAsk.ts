import { FastifyInstance } from "fastify"
import TourGroupAskController from "../../../controllers/SolutionPartner/Tour/TourGroupAskController"

import { validate } from "@/middlewares/validate"
import { tourGroupAskQuerySchema, tourGroupAskUpdateSchema } from "@/validators/tourGroupAsk"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"
import { makeAuditLogger } from "@/middlewares/logMiddleware"
import TourGroupAskModel from "@/models/TourGroupAskModel"
import { validateQuery } from "@/middlewares/validateQuery"

export default async function tourGroupAskRoutes(fastify: FastifyInstance) {
	const tourGroupAskController = new TourGroupAskController()

	const tourGroupAskAuditLogger = makeAuditLogger({
		targetName: "tour_group_asks",
		model: new TourGroupAskModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(tourGroupAskQuerySchema)],
		handler: tourGroupAskController.dataTable,
	})
	fastify.get("/:id", {
		preHandler: [authSolutionPartnerMiddleware],
		handler: tourGroupAskController.findOne,
	})
	fastify.delete("/:id", {
		preHandler: [authSolutionPartnerMiddleware, tourGroupAskAuditLogger],
		handler: tourGroupAskController.delete,
	})
	fastify.put("/:id", {
		preHandler: [authSolutionPartnerMiddleware, tourGroupAskAuditLogger],
		preValidation: [validate(tourGroupAskUpdateSchema)],
		handler: tourGroupAskController.update,
	})
}
