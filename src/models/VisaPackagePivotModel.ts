import BaseModel from "@/models/BaseModel";

class VisaPackagePivotModel extends BaseModel {
  constructor() {
    super("visa_package_pivots");
  }
  static columns = [
    'id',
    'visa_package_id',
    'language_code',
    'name',
    'description',
    'refund_policy',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default VisaPackagePivotModel;
