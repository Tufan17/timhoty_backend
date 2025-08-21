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
    return await knex("languages")
      .insert(data)
      .onConflict('code')
      .merge();
  }
   
}

export default LanguageModel;
