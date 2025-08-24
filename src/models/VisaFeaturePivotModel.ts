import BaseModel from "@/models/BaseModel";

class VisaFeaturePivotModel extends BaseModel {
  constructor() {
    super("visa_feature_pivots");
  }
  static columns = [
    'id',
    'visa_feature_id',
    'name',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default VisaFeaturePivotModel;
