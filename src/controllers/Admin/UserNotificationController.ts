import { FastifyRequest, FastifyReply } from "fastify";
import NotificationModel from "@/models/Admin/NotificationModel";
import UserNotificationModel from "@/models/Admin/UserNotification";
import knex from "@/db/knex";
import { sendSms } from "@/services/SmsService";
import { sendMail } from "@/services/MailService";

export default class UserNotificationController {
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { notification_id, target_type, target_ids } = req.body as {
        notification_id: string;
        target_type: string;
        target_ids: string[];
      };

      const notification = await new NotificationModel().findId(
        notification_id
      );
      if (!notification) {
        return res.status(404).send({
          success: false,
          message: "Notification not found",
        });
      }

      if (target_type === "admin" && notification.type === "sms") {
        return res.status(400).send({
          success: false,
          message: "Admine sms gönderilemez. Lütfen push notification veya email gönderiniz.",
        });
      }
      if(notification.type === "push"){
        for (const target_id of target_ids) {
            await new UserNotificationModel().create({
              notification_id,
              target_type,
              target_id,
            });
          }
      }else if(notification.type === "email"){
        for (const target_id of target_ids) {
            sendMail(target_id, notification.content, notification.title);
          }
      }else if(notification.type === "sms"){
        for (const target_id of target_ids) {
            sendSms(target_id, notification.content);
          }
      }


      return res.status(200).send({
        success: true,
        message: "User notification created successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const user_id = (req.user as any)?.id;
      const userNotifications =
        await new UserNotificationModel().findAllByTargetId(user_id, "admin");
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

      // Total count query
      let countQuery = knex("user_notifications as un")
        .leftJoin("notifications as n", "un.notification_id", "n.id")
        .where("un.target_id", user_id)
        .where("un.target_type", "admin");

      if (search) {
        countQuery = countQuery.andWhere(function () {
          this.where("un.title", "ilike", `%${search}%`)
            .orWhere("n.title", "ilike", `%${search}%`)
            .orWhere("n.content", "ilike", `%${search}%`);
        });
      }

      const totalResult = await countQuery.clone().countDistinct("un.id as total");
      const total = Number(totalResult[0]?.total || 0);

      // Data query
      let query = knex
        .from("user_notifications as un")
        .leftJoin("notifications as n", "un.notification_id", "n.id")
        .where("un.target_id", user_id)
        .where("un.target_type", "admin");

      if (search) {
        query = query.andWhere(function () {
          this.where("un.title", "ilike", `%${search}%`)
            .orWhere("n.title", "ilike", `%${search}%`)
            .orWhere("n.content", "ilike", `%${search}%`);
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
