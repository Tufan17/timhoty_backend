import BaseModel from "@/models/BaseModel";

class HotelGalleryPivotModel extends BaseModel {
  constructor() {
    super("hotel_gallery_pivot");
  }
  static columns = [
    'id',
    'hotel_gallery_id',
    'category',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default HotelGalleryPivotModel;
