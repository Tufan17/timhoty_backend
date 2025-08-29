import BaseModel from "@/models/BaseModel";

class CarRentalPackageFeatureModel extends BaseModel {
  constructor() {
    super("car_rental_package_features");
  }
  
  static columns = [
    'id',
    'car_rental_package_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalPackageFeatureModel;
