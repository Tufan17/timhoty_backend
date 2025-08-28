import BaseModel from "@/models/BaseModel";

class CarRentalPackagePivotModel extends BaseModel {
  constructor() {
    super("car_rental_package_pivots");
  }
  
  static columns = [
    'id',
    'car_rental_package_id',
    'language_code',
    'name',
    'description',
    'refund_policy',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalPackagePivotModel;
