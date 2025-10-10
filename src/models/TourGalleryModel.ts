import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourGalleryModel extends BaseModel {
  constructor() {
    super("tour_galleries");
  }

  static columns = [
    'id',
    'tour_id',
    'image_url',
    'image_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async findByTourId(tourId: string) {
    return await knex("tour_galleries")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .select(TourGalleryModel.columns);
  }

  async deleteByTourId(tourId: string) {
    await knex("tour_galleries")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async findWithTranslations(tourId: string, languageCode: string = "en") {
    return await knex("tour_galleries")
      .where("tour_galleries.tour_id", tourId)
      .whereNull("tour_galleries.deleted_at")
      .leftJoin(
        "tour_gallery_pivots",
        "tour_galleries.id",
        "tour_gallery_pivots.tour_gallery_id"
      )
      .where("tour_gallery_pivots.language_code", languageCode)
      .whereNull("tour_gallery_pivots.deleted_at")
      .select([
        "tour_galleries.*",
        "tour_gallery_pivots.category"
      ]);
  }

  async hasCoverImage(tour_id: string) {
    return await knex("tour_gallery_pivots")
      .join("tour_galleries", "tour_gallery_pivots.tour_gallery_id", "tour_galleries.id")
      .where({
        "tour_galleries.tour_id": tour_id,
        "tour_gallery_pivots.category": "Kapak Resmi",
      })
      .whereNull("tour_galleries.deleted_at")
      .whereNull("tour_gallery_pivots.deleted_at")
      .first();
  }
}

export default TourGalleryModel;
