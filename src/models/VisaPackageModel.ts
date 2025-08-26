import BaseModel from "@/models/BaseModel";

class VisaPackageModel extends BaseModel {
  constructor() {
    super("visa_packages");
  }
  static columns = [
    'id',
    'visa_id',
    'return_acceptance_period',
    'discount',
    'total_tax_amount',
    'constant_price',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default VisaPackageModel;
