import { FastifyInstance } from "fastify";
import CommentsController from "@/controllers/User/CommentController";
import { validate } from "@/middlewares/validate";
import { createCommentSchema } from "@/validators/comments";
import { authUserMiddleware } from "@/middlewares/authUserMiddleware";

export default async function userRoutes(fastify: FastifyInstance) {
  const commentsController = new CommentsController();

  fastify.post(
    "/",
    {
      preHandler: [authUserMiddleware],
      preValidation: [validate(createCommentSchema)],
    },
    commentsController.create.bind(commentsController)
  );
}
