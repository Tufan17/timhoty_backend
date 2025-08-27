import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class CarRentalFeatureModel extends BaseModel {
  constructor() {
    super("car_rental_features");
  }
  static columns = [
    'id',
    'car_rental_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async existFeature(data: { car_rental_id: string; name: string }) {
    const { car_rental_id, name } = data;
    const feature = await knex("car_rental_features")
      .whereNull("car_rental_features.deleted_at")
      .leftJoin("car_rental_feature_pivots", "car_rental_features.id", "car_rental_feature_pivots.car_rental_feature_id")
      .where("car_rental_id", car_rental_id)
      .where("car_rental_feature_pivots.name", name)
      .first();
    return !!feature;
  }
}

export default CarRentalFeatureModel;
