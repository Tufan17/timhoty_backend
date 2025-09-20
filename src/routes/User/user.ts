import { FastifyInstance } from "fastify"
import UserController from "@/controllers/User/UserController"
import { authUserMiddleware } from "@/middlewares/authUserMiddleware"
import { validateFormData } from "@/middlewares/validateFormData"
import UpdateAvatarController from "@/controllers/User/UpdateAvatarController"
import { avatarUpdateSchema } from "@/validators/user"

export default async function userRoutes(fastify: FastifyInstance) {
	const userController = new UserController()
	const updateAvatarController = new UpdateAvatarController()
	fastify.get("/:id", {
		handler: userController.read,
		preHandler: [authUserMiddleware],
	})
	fastify.put("/:id", {
		handler: userController.update,
		preHandler: [authUserMiddleware],
	})
	fastify.put("/:id/avatar", {
		preHandler: [authUserMiddleware],
		preValidation: [validateFormData(avatarUpdateSchema)],
		handler: updateAvatarController.updateAvatar,
	})
}
