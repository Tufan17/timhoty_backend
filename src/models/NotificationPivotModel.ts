import BaseModel from "@/models/BaseModel";

class NotificationPivotModel extends BaseModel {
  constructor() {
    super("notification_pivots");
  }
  static columns = [
    'id',
    'notification_id',
    'language_code',
    'title',
    'description',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default NotificationPivotModel;
