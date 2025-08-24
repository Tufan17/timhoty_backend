import BaseModel from "@/models/BaseModel";

class VisaGalleryModel extends BaseModel {
  constructor() {
    super("visa_galleries");
  }
  static columns = [
    'id',
    'visa_id',
    'image_url',
    'image_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default VisaGalleryModel;
