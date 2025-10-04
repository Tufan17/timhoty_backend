import { FastifyRequest, FastifyReply } from "fastify";
import CommentModel from "@/models/CommentModel";
import HotelModel from "@/models/HotelModel";
import CarRentalModel from "@/models/CarRentalModel";
import ActivityModel from "@/models/ActivityModel";
import TourModel from "@/models/TourModel";
import VisaModel from "@/models/VisaModel";

export default class CommentController {
  // Add a new comment
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { reservation_id, service_type, service_id, comment, rating } =
        req.body as {
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
      const hasCommented = await commentModel.hasUserCommented(
        reservation_id,
        service_type,
        service_id,
        userId
      );
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
      this.calculateAverageRating(service_type, service_id);

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

  async calculateAverageRating(service_type: string, service_id: string) {
    try {
      const commentModel = new CommentModel();
      let model = null;
      if (service_type === "hotel") {
        model = new HotelModel();
      } else if (service_type === "car_rental") {
        model = new CarRentalModel();
      } else if (service_type === "activity") {
        model = new ActivityModel();
      } else if (service_type === "tour") {
        model = new TourModel();
      } else if (service_type === "visa") {
        model = new VisaModel();
      }
      const averageRating = await commentModel.getAverageRating(
        service_type,
        service_id
      );

      if (model) {
        await model.update(service_id, {
          average_rating: averageRating.average_rating,
          comment_count: averageRating.total_comments,
        });
      }
      return averageRating;
    } catch (error: any) {
      console.error("Calculate average rating error:", error);
      return {
        success: false,
        message: "Calculate average rating error",
      };
    }
  }
}
