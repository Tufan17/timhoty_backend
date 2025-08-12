import BaseModel from "../BaseModel";

export default class DealerTokenModel extends BaseModel {
  constructor() {
    super("dealer_tokens");
  }
  static columns = [
    "id",
    "dealer_id",
    "token",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
}