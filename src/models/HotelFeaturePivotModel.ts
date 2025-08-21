import BaseModel from "@/models/BaseModel";

class HotelFeaturePivotModel extends BaseModel {
  constructor() {
    super("hotel_feature_pivots");
  }
  static columns = [
    'id',
    'hotel_feature_id',
    'name',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default HotelFeaturePivotModel;
