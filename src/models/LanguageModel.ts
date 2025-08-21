import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";
class LanguageModel extends BaseModel {
  constructor() {
    super("languages");
  }
  static columns = [
    'id',
    'code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
  async createLanguage(data: any) {

    const existingLanguage = await knex("languages").where("code", data.code).first();
    if (existingLanguage) {
      await knex("languages")
        .where("code", data.code)
        .update({ deleted_at: null });
    } else {
      await knex("languages").insert(data);
    }
  }
   
}

export default LanguageModel;
