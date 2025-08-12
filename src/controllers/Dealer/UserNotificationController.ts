import { FastifyRequest, FastifyReply } from "fastify";
import NotificationModel from "@/models/Admin/NotificationModel";
import UserNotificationModel from "@/models/Admin/UserNotification";
import knex from "@/db/knex";

export default class UserNotificationController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const user_id = (req.user as any)?.id;
      const userNotifications =
        await new UserNotificationModel().findAllByTargetId(user_id, "dealer");
      return res.status(200).send({
        success: true,
        data: userNotifications,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async read(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const userNotification = await new UserNotificationModel().findId(id);
      if (!userNotification) {
        return res.status(404).send({
          success: false,
          message: "User notification not found",
        });
      }
      await new UserNotificationModel().update(id, { is_read: true });
      return res.status(200).send({
        success: true,
        message: "User notification read successfully",
      });
    } catch (error) {}
  }

  async datatable(req: FastifyRequest, res: FastifyReply) {
    try {
      const { page = 1, limit = 10, search = "" } = req.query as {
        page?: number;
        limit?: number;
        search?: string;
      };
      const user_id = (req.user as any)?.id;

      // Data query
      let query = knex
        .from("user_notifications as un")
        .leftJoin("notifications as n", "un.notification_id", "n.id")
        .where("un.target_id", user_id)
        .where("un.target_type", "dealer");

      if (search) {
        query = query.andWhere(function () {
          this.where("un.title", "ilike", `%${search}%`)
            .orWhere("n.title", "ilike", `%${search}%`)
            .orWhere("n.content", "ilike", `%${search}%`)
            .orWhere("un.message", "ilike", `%${search}%`);
        });
      }

      const data = await query
        .select(
          "un.*",
          "n.title as notification_title",
          "n.content as notification_content",
          "n.created_at as notification_created_at",
          "n.updated_at as notification_updated_at",
          "n.deleted_at as notification_deleted_at"
        )
        .orderBy("un.created_at", "desc")
        .limit(limit)
        .offset((page - 1) * limit);

        const totalResult = await knex
        .from("user_notifications")
        .where("target_id", user_id)
        .where("target_type", "dealer")
        .clone().countDistinct("id as total").first() as any;
        const total = Number(totalResult?.total ?? 0);

      return res.status(200).send({
        success: true,
        message: "User fetched successfully",
        total,
        page,
        limit,
        data: data.map(item => ({
          ...item,
          title: item.notification_id ? item.notification_title : item.title,
          message: item.notification_id ? item.notification_content : item.message,
          notification_id: item.notification_id,
        })),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
