import { FastifyInstance } from "fastify"
import FCMTokenController from "@/controllers/User/FCMTokenController"

export default async function fcmTokenRoutes(fastify: FastifyInstance) {
	const fcmTokenController = new FCMTokenController()

	fastify.post("/", {
		handler: fcmTokenController.saveToken.bind(fcmTokenController),
	})
}

