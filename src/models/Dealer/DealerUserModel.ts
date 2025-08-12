import BaseModel from "../BaseModel";

export default class DealerUserModel extends BaseModel {
  constructor() {
    super("dealer_users");
  }
  static columns = [
    "id",
    "type", //manager,user
    "name_surname",
    "tc_no",
    "gsm",
    "email",
    "password",
    "status",
    "verify",
    "dealer_id",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
}