import BaseModel from "@/models/BaseModel";

class HotelPivotModel extends BaseModel {
  constructor() {
    super("hotel_pivots");
  }
  static columns = [
    'id',
    'hotel_id',
    'name',
    'general_info',
    'hotel_info',
    'refund_policy',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

  export default HotelPivotModel;
