import BaseModel from "../BaseModel";
import knex from "@/db/knex";

export default class UserNotification extends BaseModel {
  constructor() {
    super("user_notifications");
  }
  static columns = [
    "id",
    "notification_id",
    "target_type",
    "target_id",
    "title",
    "message",
    "link",
    "is_read",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
  // static columns = ['id', 'type', 'title', 'content', 'created_at', 'updated_at', 'deleted_at']

  async findAllByTargetId(target_id: string, target_type: string) {
    const data = await knex
      .select("*")
      .from("user_notifications as un")
      .leftJoin("notifications as n", "un.notification_id", "n.id")
      .select(
        "un.id as user_notification_id",
        "un.notification_id",
        "un.target_type",
        "un.target_id",
        "un.title",
        "un.message",
        "un.link",
        "un.is_read",
        "un.created_at",
        "un.updated_at",
        "un.deleted_at",
        "n.type",
        "n.title as notification_title",
        "n.content as notification_content",
        "n.created_at as notification_created_at",
        "n.updated_at as notification_updated_at",
        "n.deleted_at as notification_deleted_at"
      )
      .where("un.target_id", target_id)
      .where("un.target_type", target_type)
      .orderBy("un.created_at", "desc");

    if (data.length === 0) {
      return [];
    }
    return data
      .sort(
        (a, b) =>
          a.is_read - b.is_read
      )
      .map((item) => ({
        id: item.user_notification_id,
        target_type: item.target_type,
        target_id: item.target_id,
        title: item.notification_id ? item.notification_title : item.title,
        message: item.notification_id
          ? item.notification_content
          : item.message,
        link: item.link,
        is_read: item.is_read,
        notification_id: item.notification_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
      }));
  }
}
