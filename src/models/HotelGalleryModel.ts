import BaseModel from "@/models/BaseModel";

class HotelGalleryModel extends BaseModel {
  constructor() {
    super("hotel_galleries");
  }
  static columns = [
    'id',
    'hotel_id',
    'image_url',
    'image_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default HotelGalleryModel;
