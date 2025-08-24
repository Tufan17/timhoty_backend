import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class VisaFeatureModel extends BaseModel {
  constructor() {
    super("visa_features");
  }
  static columns = [
    'id',
    'visa_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async existFeature(data: { visa_id: string; name: string }) {
    const { visa_id, name } = data;
    const feature = await knex("visa_features")
      .whereNull("visa_features.deleted_at")
      .leftJoin("visa_feature_pivots", "visa_features.id", "visa_feature_pivots.visa_feature_id")
      .where("visa_id", visa_id)
      .where("visa_feature_pivots.name", name)
      .first();
    return !!feature;
  }
}

export default VisaFeatureModel;
