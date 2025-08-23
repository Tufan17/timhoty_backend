import BaseModel from "@/models/BaseModel";

class HotelRoomImageModel extends BaseModel {
  constructor() {
    super("hotel_room_images");
  }
  static columns = [
    'id',
    'hotel_room_id',
    'image_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default HotelRoomImageModel;
