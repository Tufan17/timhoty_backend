import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourFeaturePivotModel extends BaseModel {
  constructor() {
    super("tour_feature_pivots");
  }

  static columns = [
    'id',
    'tour_feature_id',
    'language_code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];


}

export default TourFeaturePivotModel;
