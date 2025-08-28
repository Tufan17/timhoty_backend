import BaseModel from "@/models/BaseModel";

class CarRentalPackageModel extends BaseModel {
  constructor() {
    super("car_rental_packages");
  }
  
  static columns = [
    'id',
    'car_rental_id',
    'return_acceptance_period',
    'discount',
    'total_tax_amount',
    'constant_price',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalPackageModel;
