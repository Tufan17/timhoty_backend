import BaseModel from "@/models/BaseModel";

class CountryModel extends BaseModel {
  constructor() {
    super("countries");
  }
  static columns = [
    'id',
    'code',
    'phone_code',
    'timezone',
    'flag',
    'currency_id',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CountryModel;
