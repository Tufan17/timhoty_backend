import { FastifyInstance } from "fastify"
import DashboardController from "@/controllers/User/DashboardController"

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
	fastify.get("/blogs", {
		handler: dashboardController.blogs,
	})
	fastify.get("/blogs/:id", {
		handler: dashboardController.blog,
	})
}
