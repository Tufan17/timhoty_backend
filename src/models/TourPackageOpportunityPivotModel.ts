import BaseModel from "@/models/BaseModel";

class TourPackageOpportunityPivotModel extends BaseModel {
  constructor() {
    super("tour_package_opportunity_pivots");
  }
  static columns = [
    'id',
    'tour_package_opportunity_id',
    'name',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default TourPackageOpportunityPivotModel;
