import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourGalleryPivotModel extends BaseModel {
  constructor() {
    super("tour_gallery_pivots");
  }

  static columns = [
    'id',
    'tour_gallery_id',
    'category',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async findByTourGalleryId(tourGalleryId: string, languageCode: string = "en") {
    return await knex("tour_gallery_pivots")
      .where("tour_gallery_id", tourGalleryId)
      .where("language_code", languageCode)
      .whereNull("deleted_at")
      .first();
  }

  async deleteByTourGalleryId(tourGalleryId: string) {
    await knex("tour_gallery_pivots")
      .where("tour_gallery_id", tourGalleryId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async updateCategory(tourGalleryId: string, category: string, languageCode: string = "en") {
    const existing = await this.findByTourGalleryId(tourGalleryId, languageCode);
    
    if (existing) {
      return await knex("tour_gallery_pivots")
        .where("id", existing.id)
        .update({ 
          category, 
          updated_at: new Date() 
        });
    } else {
      return await knex("tour_gallery_pivots").insert({
        tour_gallery_id: tourGalleryId,
        category,
        language_code: languageCode
      });
    }
  }
}

export default TourGalleryPivotModel;
