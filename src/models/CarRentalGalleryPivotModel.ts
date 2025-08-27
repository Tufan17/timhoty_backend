import BaseModel from "@/models/BaseModel";

class CarRentalGalleryPivotModel extends BaseModel {
  constructor() {
    super("car_rental_gallery_pivots");
  }
  
  static columns = [
    'id',
    'car_rental_gallery_id',
    'category',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalGalleryPivotModel;
