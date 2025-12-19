import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import NotificationModel from "@/models/NotificationModel";
import UserNotificationModel from "@/models/UserNotificationModel";
import { translateCreate } from "@/helper/translate";
import { sendNotification } from "@/utils/pushNotification";

export default class NotificationController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };
      const language = req.language;

      // First get total count using a separate query
      const countResult = await knex("notifications")
        .leftJoin(
          "notification_pivots",
          "notifications.id",
          "notification_pivots.notification_id"
        )
        .whereNull("notifications.deleted_at")
        .where("notification_pivots.language_code", language)
        .where(function () {
          this.where("service_type", "ilike", `%${search}%`)
            .orWhere("type", "ilike", `%${search}%`)
            .orWhere("notification_pivots.title", "ilike", `%${search}%`)
            .orWhere("notification_pivots.description", "ilike", `%${search}%`);
        })
        .countDistinct("notifications.id as total")
        .first();

      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Then get paginated data with a separate query
      const data = await knex("notifications")
        .select([
          "notifications.*",
          "notification_pivots.title",
          "notification_pivots.description",
        ])
        .leftJoin(
          "notification_pivots",
          "notifications.id",
          "notification_pivots.notification_id"
        )
        .whereNull("notifications.deleted_at")
        .where("notification_pivots.language_code", language)
        .where(function () {
          this.where("service_type", "ilike", `%${search}%`)
            .orWhere("type", "ilike", `%${search}%`)
            .orWhere("notification_pivots.title", "ilike", `%${search}%`)
            .orWhere("notification_pivots.description", "ilike", `%${search}%`);
        })
        .orderBy("notifications.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("NOTIFICATION.NOTIFICATION_FETCHED_SUCCESS"),
        data: data.map((item: any) => ({
          ...item,
          title: item.title || null,
          description: item.description || null,
        })),
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("NOTIFICATION.NOTIFICATION_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const notification = await knex("notifications")
        .innerJoin("notification_pivots", "notifications.id", "notification_pivots.notification_id")
        .where("notifications.id", id)
        .where("notification_pivots.language_code", req.language)
        .select("notifications.*", "notification_pivots.title", "notification_pivots.description")
        .first();

      if (!notification) {
        return res.status(404).send({
          success: false,
          message: req.t("NOTIFICATION.NOTIFICATION_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("NOTIFICATION.NOTIFICATION_FETCHED_SUCCESS"),
        data: notification,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("NOTIFICATION.NOTIFICATION_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { service_type, type, title, description } = req.body as {
        service_type: string;
        type: string;
        title: string;
        description: string;
      };

      const notification = await new NotificationModel().create({
        service_type,
        type,
      });
      const translateResult = await translateCreate({
        target: "notification_pivots",
        target_id_key: "notification_id",
        target_id: notification.id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      notification.notification_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("NOTIFICATION.NOTIFICATION_CREATED_SUCCESS"),
        data: notification,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("NOTIFICATION.NOTIFICATION_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { service_type, type, title, description } = req.body as {
        service_type?: string;
        type?: string;
        title?: string;
        description?: string;
      };

      const existingNotification = await new NotificationModel().first({ id });

      if (!existingNotification) {
        return res.status(404).send({
          success: false,
          message: req.t("NOTIFICATION.NOTIFICATION_NOT_FOUND"),
        });
      }

      // Check for duplicate service_type and type combination if updating
      if (
        (service_type && service_type !== existingNotification.service_type) ||
        (type && type !== existingNotification.type)
      ) {
        const checkServiceType =
          service_type || existingNotification.service_type;
        const checkType = type || existingNotification.type;

        const existingNotificationByCombo = await new NotificationModel().first(
          {
            service_type: checkServiceType,
            type: checkType,
          }
        );

        if (
          existingNotificationByCombo &&
          existingNotificationByCombo.id !== id
        ) {
          return res.status(400).send({
            success: false,
            message: req.t("NOTIFICATION.NOTIFICATION_ALREADY_EXISTS"),
          });
        }
      }

      let body: any = {
        service_type: service_type || existingNotification.service_type,
        type: type || existingNotification.type,
      };

      const updatedNotification = await new NotificationModel().update(
        id,
        body
      );
      const translateResult = await translateCreate({
        target: "notification_pivots",
        target_id_key: "notification_id",
        target_id: updatedNotification.id,
        data: {
          title,
          description,
        },
        language_code: req.language,
      });
      updatedNotification.notification_pivots = translateResult;
      return res.status(200).send({
        success: true,
        message: req.t("NOTIFICATION.NOTIFICATION_UPDATED_SUCCESS"),
        data: updatedNotification[0],
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("NOTIFICATION.NOTIFICATION_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const existingNotification = await new NotificationModel().first({ id });

      if (!existingNotification) {
        return res.status(404).send({
          success: false,
          message: req.t("NOTIFICATION.NOTIFICATION_NOT_FOUND"),
        });
      }

      await new NotificationModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("NOTIFICATION.NOTIFICATION_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("NOTIFICATION.NOTIFICATION_DELETED_ERROR"),
      });
    }
  }

  async assignToUsers(req: FastifyRequest, res: FastifyReply) {
    try {
      const { notification_id, target_type, target_ids } = req.body as {
        notification_id: string;
        target_type: string;
        target_ids: string[];
      };

      // Check if notification exists
      const notification = await new NotificationModel().first({ id: notification_id });
      if (!notification) {
        return res.status(404).send({
          success: false,
          message: req.t("NOTIFICATION.NOTIFICATION_NOT_FOUND"),
        });
      }

      // Get notification details with pivot data
      const notificationWithPivot = await knex("notifications")
        .innerJoin("notification_pivots", "notifications.id", "notification_pivots.notification_id")
        .where("notifications.id", notification_id)
        .where("notification_pivots.language_code", req.language)
        .select("notifications.*", "notification_pivots.title", "notification_pivots.description")
        .first();

      const userNotificationModel = new UserNotificationModel();
      const createdNotifications = [];

      if (target_type === "users") {
        const users = await knex("users").whereIn("id", target_ids).whereNotNull("device_id");
console.log(users);
        for (const user of users) {
          await sendNotification(user.device_id, notificationWithPivot?.title || null, notificationWithPivot?.description || null);
        }
      }

      // Create user notifications for each target_id
      for (const target_id of target_ids) {
        const userNotificationData = {
          notification_id,
          target_type,
          target_id,
          title: notificationWithPivot?.title || null,
          message: notificationWithPivot?.description || null,
          link: null, // You can add link logic if needed
          is_read: false,
        };

        const createdNotification = await userNotificationModel.create(userNotificationData);
        createdNotifications.push(createdNotification);
      }

      return res.status(200).send({
        success: true,
        message: req.t("NOTIFICATION.NOTIFICATION_ASSIGNED_SUCCESS"),
        data: {
          notification_id,
          target_type,
          assigned_count: createdNotifications.length,
          assigned_notifications: createdNotifications,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("NOTIFICATION.NOTIFICATION_ASSIGNED_ERROR"),
      });
    }
  }
}
