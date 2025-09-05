import { FastifyInstance } from "fastify"
import ActivityTypeController from "../../../controllers/SolutionPartner/Activity/ActivityTypeController"
import { activityQuerySchema } from "../../../validators/Activity/activity"
import { validateQuery } from "../../../middlewares/validateQuery"
import { authSolutionPartnerMiddleware } from "@/middlewares/authSolutionPartnerMiddleware"

export default async function activityTypesRoutes(fastify: FastifyInstance) {
	const activityTypeController = new ActivityTypeController()

	fastify.get("/", {
		preHandler: [authSolutionPartnerMiddleware],
		preValidation: [validateQuery(activityQuerySchema)],
		handler: activityTypeController.findAll,
	})
}
