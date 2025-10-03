import { FastifyRequest, FastifyReply } from "fastify";
import CommentModel from "@/models/CommentModel";

export default class CommentController {
  // Add a new comment
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { reservation_id, service_type, service_id, comment, rating } = req.body as {
        reservation_id: string;
        service_type: string;
        service_id: string;
        comment: string;
        rating: number;
      };
      const userId = (req as any).user?.id;
      const language = (req as any).language || "en";

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const commentModel = new CommentModel();

      // Check if user has already commented on this service
      const hasCommented = await commentModel.hasUserCommented(service_type, service_id, userId);
      if (hasCommented) {
        return res.status(400).send({
          success: false,
          message: req.t("COMMENTS.ALREADY_COMMENTED"),
        });
      }

      const newComment = await commentModel.create({
        reservation_id,
        service_type,
        service_id,
        user_id: userId,
        comment,
        rating,
        language_code: language,
      });

      return res.status(201).send({
        success: true,
        message: req.t("COMMENTS.COMMENT_CREATED_SUCCESS"),
        data: newComment,
      });
    } catch (error: any) {
      console.error("Create comment error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.COMMENT_CREATE_ERROR"),
      });
    }
  }

  // Update user's existing comment
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { comment, rating } = req.body as { comment: string; rating: number };
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const commentModel = new CommentModel();

      // Check if comment exists and belongs to user
      const existingComment = await commentModel.findId(id);
      if (!existingComment) {
        return res.status(404).send({
          success: false,
          message: req.t("COMMENTS.COMMENT_NOT_FOUND"),
        });
      }

      if (existingComment.user_id !== userId) {
        return res.status(403).send({
          success: false,
          message: req.t("COMMENTS.COMMENT_NOT_OWNED"),
        });
      }

      const updatedComment = await commentModel.update(id, {
        comment,
        rating,
      });

      return res.status(200).send({
        success: true,
        message: req.t("COMMENTS.COMMENT_UPDATED_SUCCESS"),
        data: updatedComment[0],
      });
    } catch (error: any) {
      console.error("Update comment error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.COMMENT_UPDATE_ERROR"),
      });
    }
  }

  // Delete user's comment
  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const commentModel = new CommentModel();

      // Check if comment exists and belongs to user
      const existingComment = await commentModel.findId(id);
      if (!existingComment) {
        return res.status(404).send({
          success: false,
          message: req.t("COMMENTS.COMMENT_NOT_FOUND"),
        });
      }

      if (existingComment.user_id !== userId) {
        return res.status(403).send({
          success: false,
          message: req.t("COMMENTS.COMMENT_NOT_OWNED"),
        });
      }

      await commentModel.delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("COMMENTS.COMMENT_DELETED_SUCCESS"),
        data: null,
      });
    } catch (error: any) {
      console.error("Delete comment error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.COMMENT_DELETE_ERROR"),
      });
    }
  }

  // Get comments for a specific service
  async getByService(req: FastifyRequest, res: FastifyReply) {
    try {
      const { service_type, service_id } = req.query as {
        service_type: string;
        service_id: string;
      };
      const language = (req as any).language || "en";

      if (!service_type || !service_id) {
        return res.status(400).send({
          success: false,
          message: req.t("COMMENTS.SERVICE_TYPE_AND_ID_REQUIRED"),
        });
      }

      const commentModel = new CommentModel();
      const comments = await commentModel.getCommentsByService(service_type, service_id, language);

      return res.status(200).send({
        success: true,
        message: req.t("COMMENTS.COMMENTS_FETCHED_SUCCESS"),
        data: comments,
      });
    } catch (error: any) {
      console.error("Get comments by service error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.COMMENTS_FETCH_ERROR"),
      });
    }
  }

  // Get service rating statistics
  async getRatingStats(req: FastifyRequest, res: FastifyReply) {
    try {
      const { service_type, service_id } = req.query as {
        service_type: string;
        service_id: string;
      };

      if (!service_type || !service_id) {
        return res.status(400).send({
          success: false,
          message: req.t("COMMENTS.SERVICE_TYPE_AND_ID_REQUIRED"),
        });
      }

      const commentModel = new CommentModel();
      const [averageRating, ratingDistribution] = await Promise.all([
        commentModel.getAverageRating(service_type, service_id),
        commentModel.getRatingDistribution(service_type, service_id),
      ]);

      return res.status(200).send({
        success: true,
        message: req.t("COMMENTS.RATING_STATS_FETCHED_SUCCESS"),
        data: {
          average_rating: averageRating.average_rating,
          total_comments: averageRating.total_comments,
          rating_distribution: ratingDistribution,
        },
      });
    } catch (error: any) {
      console.error("Get rating stats error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.RATING_STATS_FETCH_ERROR"),
      });
    }
  }

  // Get user's own comments
  async getMyComments(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const language = (req as any).language || "en";

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const commentModel = new CommentModel();
      const comments = await commentModel.where("user_id", userId, "*", "created_at desc");

      return res.status(200).send({
        success: true,
        message: req.t("COMMENTS.MY_COMMENTS_FETCHED_SUCCESS"),
        data: comments,
      });
    } catch (error: any) {
      console.error("Get my comments error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.MY_COMMENTS_FETCH_ERROR"),
      });
    }
  }

  // Get recent comments (public endpoint)
  async getRecentComments(req: FastifyRequest, res: FastifyReply) {
    try {
      const { limit } = req.query as { limit?: string };
      const language = (req as any).language || "en";
      const limitNum = limit ? parseInt(limit) : 10;

      const commentModel = new CommentModel();
      const comments = await commentModel.getRecentComments(limitNum, language);

      return res.status(200).send({
        success: true,
        message: req.t("COMMENTS.RECENT_COMMENTS_FETCHED_SUCCESS"),
        data: comments,
      });
    } catch (error: any) {
      console.error("Get recent comments error:", error);
      return res.status(500).send({
        success: false,
        message: req.t("COMMENTS.RECENT_COMMENTS_FETCH_ERROR"),
      });
    }
  }
}
