import { FastifyInstance } from "fastify"
import TourGroupAskController from "../../controllers/User/TourGroupAskController"

// import TourGroupAskModel from "@/models/TourGroupAskModel"
// import { makeAuditLogger } from "@/middlewares/logMiddleware"
import { validate } from "@/middlewares/validate"
import { tourGroupAskSchema } from "@/validators/tourGroupAsk"

// import { makeAuditLogger } from "../../middlewares/logMiddleware"
// import UserGuideModel from "@/models/UserGuideModel"

export default async function tourGroupAskRoutes(fastify: FastifyInstance) {
	const tourGroupAskController = new TourGroupAskController()

	// const tourGroupAskAuditLogger = makeAuditLogger({
	// 	targetName: "tour_group_asks",
	// 	model: new TourGroupAskModel(),
	// 	idParam: "id",
	// 	getUser: request => (request as any).user || {},
	// })

	fastify.post("/", {
		preValidation: [validate(tourGroupAskSchema)],
		handler: tourGroupAskController.create,
	})
}
