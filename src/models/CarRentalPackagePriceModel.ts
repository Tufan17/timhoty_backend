import BaseModel from "@/models/BaseModel";

class CarRentalPackagePriceModel extends BaseModel {
  constructor() {
    super("car_rental_package_prices");
  }
  
  static columns = [
    'id',
    'car_rental_package_id',
    'main_price',
    'child_price',
    'currency_id',
    'start_date',
    'end_date',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalPackagePriceModel;
