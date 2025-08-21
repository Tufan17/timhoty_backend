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
    existingLanguage.deleted_at = null;
    await knex("languages")
      .insert(existingLanguage)
      .onConflict('code')
      .merge(['deleted_at']);
  }
   
}

export default LanguageModel;
