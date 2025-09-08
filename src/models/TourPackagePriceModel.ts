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

  async getCurrentPriceByTourPackageId(tourPackageId: string, isConstantPrice: boolean) {
    const today = new Date().toISOString().split('T')[0];
    
    if (isConstantPrice) {
      // Sabit fiyat ise ilk fiyatı al
      return await knex("tour_package_prices")
        .where("tour_package_id", tourPackageId)
        .whereNull("deleted_at")
        .orderBy("created_at", "asc")
        .first();
    } else {
      // Tarihli fiyat ise bugünün tarihine uygun fiyatı al
      return await knex("tour_package_prices")
        .where("tour_package_id", tourPackageId)
        .whereNull("deleted_at")
        .where(function() {
          this.where(function() {
            this.where('start_date', '<=', today)
              .andWhere(function() {
                this.whereNull('end_date')
                  .orWhere('end_date', '>=', today);
              });
          });
        })
        .orderBy("start_date", "asc")
        .first();
    }
  }
}

export default TourPackagePriceModel;
