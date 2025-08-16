import BaseModel from "@/models/BaseModel";

class CityModel extends BaseModel {
  constructor() {
    super("cities");
  }
  static columns = [
    'id',
    'country_id',
    'is_active',
    'created_at',
    'updated_at',
  ];
   
}

export default CityModel;
