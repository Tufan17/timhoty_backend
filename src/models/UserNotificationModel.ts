import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class UserNotificationModel extends BaseModel {
  constructor() {
    super("user_notifications");
  }
  static columns = [
    'id',
    'notification_id',
    'target_type',
    'target_id',
    'title',
    'message',
    'link',
    'is_read',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   

  async userNotifications(id: string) {
    return await knex("user_notifications")
      .where("user_notifications.target_id", id)
      .where("user_notifications.target_type", "users")
      .innerJoin("notifications", "user_notifications.notification_id", "notifications.id")
      .innerJoin("notification_pivots", "notifications.id", "notification_pivots.notification_id")
      .select("user_notifications.*", "notifications.service_type", "notifications.type", "notification_pivots.title", "notification_pivots.description")
      .orderBy("created_at", "desc");
  }
}

export default UserNotificationModel;
