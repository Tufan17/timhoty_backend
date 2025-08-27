import BaseModel from "@/models/BaseModel";

class CarTypePivotModel extends BaseModel {
  constructor() {
    super("car_type_pivots");
  }
  static columns = [
    'id',
    'car_type_id',
    'language_code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CarTypePivotModel;
