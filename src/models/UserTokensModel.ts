import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class UserTokensModel extends BaseModel {
  constructor() {
    super("user_tokens");
  }

  static columns = [
    'id',
    'user_id',
    'token_hash',
    'device_name',
    'expires_at',
    'revoked_at',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async findValidToken(userId: string, tokenHash: string) {
    const token = await knex("user_tokens")
      .whereNull("deleted_at")
      .whereNull("revoked_at")
      .where("user_id", userId)
      .where("token_hash", tokenHash)
      .where("expires_at", ">", knex.fn.now())
      .first();
    return token;
  }

  async revokeToken(id: string) {
    return await knex("user_tokens")
      .where("id", id)
      .update({
        revoked_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
  }
}

export default UserTokensModel;