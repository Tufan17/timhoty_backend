import { FastifyInstance } from "fastify"
import CommentController from "../../controllers/Admin/CommentController"
import { authAdminMiddleware } from "@/middlewares/authAdminMiddleware"

export default async function adminCommentRoutes(fastify: FastifyInstance) {
	const commentController = new CommentController()

	fastify.get("/", {
		preHandler: [authAdminMiddleware],
		handler: commentController.dataTable,
	})

	fastify.delete("/:id", {
		preHandler: [authAdminMiddleware],
		handler: commentController.delete,
	})
}

