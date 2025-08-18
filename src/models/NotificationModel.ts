import BaseModel from "@/models/BaseModel";

class NotificationModel extends BaseModel {
  constructor() {
    super("notifications");
  }
  static columns = [
    'id',
    'service_type',
    'type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default NotificationModel;
