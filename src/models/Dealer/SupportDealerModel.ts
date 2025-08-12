import BaseModel from "../BaseModel";
import connection from "../../db/connection";

export default class SupportDealerModel extends BaseModel {
  constructor() {
    super("support_dealer");
  }

  static columns = [
    "id",
    "title",
    "description",
    "dealer_id",
    "dealer_user_id",
    "admin_id",
    "status",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async findDealerId(id: string) {
    const supportDealer = await connection
      .table(this.modelName)
      .leftJoin(
        "dealer_users",
        "support_dealer.dealer_user_id",
        "dealer_users.id"
      )
      .leftJoin("admins", "support_dealer.admin_id", "admins.id")
      .where("support_dealer.id", id)
      .select(
        "support_dealer.*",
        "dealer_users.name_surname as dealer_user_name_surname",
        "admins.name_surname as admin_name_surname"
      ).first();

    const messages = await connection("support_dealer_messages")
      .where("ticket_id", id)
      .select("message", "docs", "sender_id", "sender_type", "created_at");

    return {
      title: supportDealer.title,
      description: supportDealer.description,
      docs: supportDealer.docs,
      dealer_user: {
        name_surname: supportDealer.dealer_user_name_surname,
        id: supportDealer.dealer_user_id,
      },
      admin: supportDealer.admin_id
        ? {
            name_surname: supportDealer.admin_name_surname,
            id: supportDealer.admin_id,
          }
        : null,
      messages: messages,
    };
  }
}
