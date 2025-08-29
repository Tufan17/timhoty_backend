import BaseModel from "@/models/BaseModel";

class CarRentalPackageFeaturePivotModel extends BaseModel {
  constructor() {
    super("car_rental_package_feature_pivots");
  }
  
  static columns = [
    'id',
    'car_rental_package_feature_id',
    'language_code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalPackageFeaturePivotModel;
