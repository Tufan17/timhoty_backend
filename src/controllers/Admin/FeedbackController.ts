import { FastifyRequest, FastifyReply } from "fastify";
import FeedbackModel from "@/models/Admin/FeedbackModel";
import LogModel from "@/models/Admin/LogModel";
import knex from "@/db/knex";
class FeedbackController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { user_id, insurance_type_id, message } = req.body as {
        user_id: string;
        insurance_type_id: string;
        message: string;
      };
      await new FeedbackModel().create({ user_id, insurance_type_id, message });
      const feedback = await new FeedbackModel().first({
        user_id,
        insurance_type_id,
        message,
      });
      await new LogModel().createLog(req.user, "create", "feedback", feedback);
      return res.status(200).send({
        success: true,
        message: "Feedback created successfully",
        data: feedback,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Feedback creation failed",
        error: error,
      });
    }
  }
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: boolean };

      const feedback = await new FeedbackModel().first({ id });
      if (!feedback) {
        return res.status(404).send({
          success: false,
          message: "Feedback not found",
        });
      }
      await new FeedbackModel().update(id, { status });
      await new LogModel().createLog(req.user, "update", "feedback", feedback);
      return res.status(200).send({
        success: true,
        message: "Feedback updated successfully",
        data: feedback,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Feedback update failed",
        error: error,
      });
    }
  }
  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingFeedback = await new FeedbackModel().first({ id });
      if (!existingFeedback) {
        return res.status(404).send({
          success: false,
          message: "Feedback not found",
        });
      }

      await new FeedbackModel().delete(id);
      await new LogModel().createLog(
        req.user,
        "delete",
        "feedback",
        existingFeedback
      );
      return res.status(200).send({
        success: true,
        message: "Feedback deleted successfully",
        data: existingFeedback,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Feedback deletion failed",
        error: error,
      });
    }
  }
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const feedbacks = await new FeedbackModel().getAll([
        "id",
        "user_id",
        "insurance_type_id",
        "message",
        "status",
        "created_at",
        "updated_at",
        "deleted_at",
      ]);
      return res.status(200).send({
        success: true,
        message: "Feedbacks fetched successfully",
        data: feedbacks,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Feedback fetching failed",
        error: error,
      });
    }
  }
  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const feedback = await knex("feedbacks")
        .where("user_id", id)
        .join(
          "insurance_types",
          "feedbacks.insurance_type_id",
          "insurance_types.id"
        )
        .select("feedbacks.*", "insurance_types.name as insurance_type_name","insurance_types.id as insurance_type_id");
      return res.status(200).send({
        success: true,
        message: "Feedback fetched successfully",
        data: feedback,
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Feedback fetching failed",
        error: error,
      });
    }
  }
  async findAllDataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const query = knex("feedbacks")
        .innerJoin("users", "feedbacks.user_id", "users.id")
        .innerJoin("insurance_types", "feedbacks.insurance_type_id", "insurance_types.id")
        .select(
          "feedbacks.*",
          "users.name_surname as user_name",
          "users.email as user_email",
          "insurance_types.name as insurance_type_name"
        )
        .orderBy("feedbacks.created_at", "desc");
      const feedbacks = await query;
      return res.status(200).send({
        success: true,
        message: "Feedbacks fetched successfully",
        data: feedbacks.map((feedback: any) => ({
          id: feedback.id,
          message: feedback.message,
          user:{
            id: feedback.user_id,
            name_surname: feedback.user_name,
            email: feedback.user_email,
          },
          insurance_type:{
            id: feedback.insurance_type_id,
            name: feedback.insurance_type_name,
          },
          status: feedback.status,
          created_at: feedback.created_at,
        })),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Feedback fetching failed",
        error: error,
      });
    }
  }
}

export default FeedbackController;
