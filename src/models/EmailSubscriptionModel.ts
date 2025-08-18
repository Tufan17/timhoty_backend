import BaseModel from "@/models/BaseModel";

class EmailSubscriptionModel extends BaseModel {
  constructor() {
    super("email_subscriptions");
  }
  static columns = [
    'id',
    'language_code',
    'email',
    'is_canceled',
    'created_at',
    'updated_at',
  ];
   
}

export default EmailSubscriptionModel;
