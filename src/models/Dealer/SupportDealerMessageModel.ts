import BaseModel from "../BaseModel";

export default class SupportDealerMessageModel extends BaseModel {
  constructor() {
    super("support_dealer_messages");
  }

  static columns = [
    "id",
    "ticket_id",
    "message",
    "docs",
    "sender_type",
    "sender_id",
    "created_at",
  ];
}
