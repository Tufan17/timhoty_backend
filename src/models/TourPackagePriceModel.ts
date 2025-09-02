import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourPackagePriceModel extends BaseModel {
  constructor() {
    super("tour_package_prices");
  }
  static columns = [
    'id',
    'tour_package_id',
    'main_price',
    'child_price',
    'baby_price',
    'currency_id',
    'start_date',
    'end_date',
    'period',
    'quota',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
  async deleteByTourPackageId(tourPackageId: string) {
    await knex("tour_package_prices")
      .where("tour_package_id", tourPackageId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getPricesByTourPackageId(tourPackageId: string) {
    return await knex("tour_package_prices")
      .where("tour_package_id", tourPackageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }
}

export default TourPackagePriceModel;
