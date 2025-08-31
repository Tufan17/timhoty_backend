import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourFeatureModel extends BaseModel {
  constructor() {
    super("tour_features");
  }

  static columns = [
    'id',
    'tour_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async findByTourId(tourId: string) {
    return await knex("tour_features")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .select(TourFeatureModel.columns);
  }

  async deleteByTourId(tourId: string) {
    await knex("tour_features")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }
}

export default TourFeatureModel;
