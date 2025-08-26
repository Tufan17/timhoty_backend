import BaseModel from "@/models/BaseModel";

class HotelRoomModel extends BaseModel {
  constructor() {
    super("hotel_rooms");
  }
  static columns = [
    'id',
    'hotel_id',
    'refund_days',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default HotelRoomModel;