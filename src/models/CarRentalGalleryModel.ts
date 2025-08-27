import BaseModel from "@/models/BaseModel";

class CarRentalGalleryModel extends BaseModel {
  constructor() {
    super("car_rental_galleries");
  }
  
  static columns = [
    'id',
    'car_rental_id',
    'image_url',
    'image_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default CarRentalGalleryModel;
