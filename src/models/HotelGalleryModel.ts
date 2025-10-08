import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

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

  async existsCategory(hotel_id: string, category: string) {
    return await knex("hotel_gallery_pivot").where({ hotel_id, category }).whereNull("deleted_at").first();
  }

  async hasCoverImage(hotel_id: string) {
    return await knex("hotel_gallery_pivot")
      .join("hotel_galleries", "hotel_gallery_pivot.hotel_gallery_id", "hotel_galleries.id")
      .where({
        "hotel_galleries.hotel_id": hotel_id,
        "hotel_gallery_pivot.category": "Kapak Resmi",
      })
      .whereNull("hotel_galleries.deleted_at")
      .whereNull("hotel_gallery_pivot.deleted_at")
      .first();
  }
}

export default HotelGalleryModel;
