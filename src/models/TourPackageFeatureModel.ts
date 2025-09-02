import BaseModel from "@/models/BaseModel";

class TourPackageFeatureModel extends BaseModel {
  constructor() {
    super("tour_package_features");
  }
  
  static columns = [
    'id',
    'tour_package_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default TourPackageFeatureModel;
