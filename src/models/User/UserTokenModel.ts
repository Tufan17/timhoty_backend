import BaseModel from "../BaseModel";

export default class UserTokenModel extends BaseModel {
  constructor() {
    super("user_tokens");
  }
  static columns = [
    "id",
    "user_id",
    "type",
    "token",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
}