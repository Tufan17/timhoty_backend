import { FastifyInstance } from "fastify"
import UserGuideController from "../../controllers/User/UserGuideController"

// import { makeAuditLogger } from "../../middlewares/logMiddleware"
// import UserGuideModel from "@/models/UserGuideModel"

export default async function userGuideRoutes(fastify: FastifyInstance) {
	const userGuideController = new UserGuideController()

	// const userGuideAuditLogger = makeAuditLogger({
	// 	targetName: "user_guides",
	// 	model: new UserGuideModel(),
	// 	idParam: "id",
	// 	getUser: request => (request as any).user || {},
	// })

	fastify.get("/", {
		handler: userGuideController.findAll,
	})
	fastify.get("/:id", {
		handler: userGuideController.findOne,
	})
}
