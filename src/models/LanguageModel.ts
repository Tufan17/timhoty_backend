import BaseModel from "@/models/BaseModel";

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
   
}

export default LanguageModel;
