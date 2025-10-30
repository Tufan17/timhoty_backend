import { FastifyInstance } from "fastify"
import UserController from "@/controllers/User/ContractsController"
import { authUserMiddleware } from "@/middlewares/authUserMiddleware"

export default async function userRoutes(fastify: FastifyInstance) {
	const userController = new UserController()
	fastify.get("/terms-of-service", {
		handler: userController.termsOfService,
		preHandler: [authUserMiddleware],
	})
	fastify.get("/privacy-policy", {
		handler: userController.privacyPolicy,
		// preHandler: [authUserMiddleware],
	})
	fastify.get("/user-agreement", {
		handler: userController.userAgreement,
		// preHandler: [authUserMiddleware],
	})
	fastify.get("/cookie-policy", {
		handler: userController.cookiePolicy,
		// preHandler: [authUserMiddleware],
	})
}
