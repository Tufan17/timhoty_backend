import BaseModel from "@/models/BaseModel";

class CarRentalFeaturePivotModel extends BaseModel {
  constructor() {
    super("car_rental_feature_pivots");
  }
  static columns = [
    'id',
    'car_rental_feature_id',
    'name',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalFeaturePivotModel;
