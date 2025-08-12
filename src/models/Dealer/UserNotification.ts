import BaseModel from "../BaseModel";

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
}
