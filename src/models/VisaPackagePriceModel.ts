import BaseModel from "@/models/BaseModel";

class VisaPackagePriceModel extends BaseModel {
  constructor() {
    super("visa_package_prices");
  }
  static columns = [
    'id',
    'visa_package_id',
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

export default VisaPackagePriceModel;