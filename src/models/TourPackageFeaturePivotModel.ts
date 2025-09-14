import BaseModel from "@/models/BaseModel";

class TourPackageFeaturePivotModel extends BaseModel {
  constructor() {
    super("tour_package_feature_pivots");
  }
  
  static columns = [
    'id',
    'tour_package_feature_id',
    'language_code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default TourPackageFeaturePivotModel;
