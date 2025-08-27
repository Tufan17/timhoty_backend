import BaseModel from "@/models/BaseModel";

class CarRentalPivotModel extends BaseModel {
  constructor() {
    super("car_rental_pivots");
  }
  static columns = [
    'id',
    'car_rental_id',
    'title',
    'general_info',
    'car_info',
    'refund_policy',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CarRentalPivotModel;
