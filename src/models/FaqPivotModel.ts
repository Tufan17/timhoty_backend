import BaseModel from "@/models/BaseModel";

class FaqPivotModel extends BaseModel {
  constructor() {
    super("faq_pivots");
  }
  static columns = [
    'id',
    'faq_id',
    'title',
    'description',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default FaqPivotModel;
