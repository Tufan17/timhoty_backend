import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class HotelFeatureModel extends BaseModel {
  constructor() {
    super("hotel_features");
  }
  static columns = [
    'id',
    'hotel_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async existFeature(data: { hotel_id: string; name: string }) {
    const { hotel_id, name } = data;
    const feature = await knex("hotel_features")
      .whereNull("hotel_features.deleted_at")
      .leftJoin("hotel_feature_pivots", "hotel_features.id", "hotel_feature_pivots.hotel_feature_id")
      .where("hotel_id", hotel_id)
      .where("hotel_feature_pivots.name", name)
      .first();
    return !!feature;
  }
}

export default HotelFeatureModel;
