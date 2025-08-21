import BaseModel from "@/models/BaseModel";

class HotelOpportunityPivotModel extends BaseModel {
  constructor() {
    super("hotel_opportunity_pivots");
  }
  static columns = [
    'id',
    'hotel_opportunity_id',
    'category',
    'description',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default HotelOpportunityPivotModel;
