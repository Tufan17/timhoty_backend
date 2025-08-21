import BaseModel from "@/models/BaseModel";

class HotelRoomPivotModel extends BaseModel {
  constructor() {
    super("hotel_room_pivots");
  }
  static columns = [
    'id',
    'hotel_room_id',
    'name',
    'description',
    'refund_policy',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default HotelRoomPivotModel;
