import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import UserNotificationModel from "@/models/UserNotificationModel";

export default class SolutionPartnerNotificationController {
  async index(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req as any).user?.id;
      const language = (req as any).language;
      const notifications =
        await new UserNotificationModel().solutionPartnerUserNotifications(
          userId,
          language
        );
      return res.status(200).send({
        success: true,
        message: "Notifications fetched successfully",
        data: notifications,
      });
    } catch (error: any) {
      console.error("Get notifications error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        is_read,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        is_read?: boolean;
      };

      const userId = (req as any).user?.id;
      const language = (req as any).language;

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      // Base query
      const baseQuery = knex("user_notifications")
        .where("user_notifications.target_id", userId)
        .where("user_notifications.target_type", "solution_partner_users")
        .whereNull("user_notifications.deleted_at")
        .innerJoin(
          "notifications",
          "user_notifications.notification_id",
          "notifications.id"
        )
        .whereNull("notifications.deleted_at")
        .innerJoin(
          "notification_pivots",
          "notifications.id",
          "notification_pivots.notification_id"
        )
        .where("notification_pivots.language_code", language)
        .whereNull("notification_pivots.deleted_at");

      // Apply filters
      if (typeof is_read !== "undefined") {
        baseQuery.where("user_notifications.is_read", is_read);
      }

      if (search) {
        const like = `%${search}%`;
        baseQuery.where(function () {
          this.where("notification_pivots.title", "ilike", like)
            .orWhere("notification_pivots.description", "ilike", like)
            .orWhere("user_notifications.message", "ilike", like);
        });
      }

      // Get total count
      const countResult = await baseQuery.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get paginated data
      const data = await baseQuery
        .clone()
        .select(
          "user_notifications.*",
          "notifications.service_type",
          "notifications.type",
          "notification_pivots.title",
          "notification_pivots.description"
        )
        .orderBy("user_notifications.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: "Notifications fetched successfully",
        data: data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      console.error("Get notifications error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  async readNotification(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.USER_NOT_FOUND"),
        });
      }

      const notification = await new UserNotificationModel().findId(id);

      if (!notification) {
        return res.status(404).send({
          success: false,
          message: "Notification not found",
        });
      }


      if (
        notification.target_id !== userId ||
        notification.target_type !== "solution_partner_users"
      ) {
        return res.status(403).send({
          success: false,
          message: "Unauthorized",
        });
      }

      await new UserNotificationModel().update(id, {
        is_read: true,
      });

      return res.status(200).send({
        success: true,
        message: "Notification marked as read successfully",
        data: { ...notification, is_read: true },
      });
    } catch (error: any) {
      console.error("Read notification error:", error);
      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  }
}
