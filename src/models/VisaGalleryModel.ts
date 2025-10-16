import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

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

  async hasCoverImage(visa_id: string) {
    return await knex("visa_gallery_pivot")
      .join("visa_galleries", "visa_gallery_pivot.visa_gallery_id", "visa_galleries.id")
      .where({
        "visa_galleries.visa_id": visa_id,
        "visa_gallery_pivot.category": "Kapak Resmi",
      })
      .whereNull("visa_galleries.deleted_at")
      .whereNull("visa_gallery_pivot.deleted_at")
      .first();
  }
}

export default VisaGalleryModel;
