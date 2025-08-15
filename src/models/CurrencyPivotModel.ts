import BaseModel from "@/models/BaseModel";

class CurrencyPivotModel extends BaseModel {
  constructor() {
    super("currency_pivots");
  }
  static columns = [
    'id',
    'currency_id',
    'name',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CurrencyPivotModel;
