import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourPivotModel extends BaseModel {
  constructor() {
    super("tour_pivots");
  }
  static columns = [
    'id',
    'tour_id',
    'title',
    'general_info',
    'tour_info',
    'refund_policy',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
  async deleteByTourId(tourId: string) {
    await knex("tour_pivots")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }
}

export default TourPivotModel;
