import BaseModel from "@/models/BaseModel";

class CurrencyModel extends BaseModel {
  constructor() {
    super("currencies");
  }
  static columns = [
    'id',
    'code',
    'symbol',
    'position',
    'is_active',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CurrencyModel;
