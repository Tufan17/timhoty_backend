import { FastifyInstance } from "fastify"
import DashboardController from "@/controllers/User/DashboardController"
import { validate } from "@/middlewares/validate"
import { emailSubscriptionUpdateSchema } from "@/validators/emailSubscription"

export default async function userRoutes(fastify: FastifyInstance) {
	const dashboardController = new DashboardController()
	fastify.get("/", {
		handler: dashboardController.index,
	})
	fastify.get("/campaign", {
		handler: dashboardController.campaigns,
	})
	fastify.get("/campaign/:id", {
		handler: dashboardController.campaign,
	})
	fastify.get("/cities", {
		handler: dashboardController.cities,
	})
	fastify.get("/countries", {
		handler: dashboardController.countries,
	})
	fastify.get("/stations", {
		handler: dashboardController.stations,
	})
	fastify.get("/blogs", {
		handler: dashboardController.blogs,
	})
	fastify.get("/blogs/:id", {
		handler: dashboardController.blog,
	})
	fastify.post("/subscription", {
		preValidation: [validate(emailSubscriptionUpdateSchema)],
		handler: dashboardController.subscription,
	})
	fastify.get("/comments", {
		handler: dashboardController.comments,
	})
}
