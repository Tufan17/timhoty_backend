import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CarRentalPackagePriceModel extends BaseModel {
  constructor() {
    super("car_rental_package_prices");
  }
  
  static columns = [
    'id',
    'car_rental_package_id',
    'main_price',
    'child_price',
    'currency_id',
    'start_date',
    'end_date',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async deleteByCarRentalPackageId(carRentalPackageId: string) {
    await knex("car_rental_package_prices")
      .where("car_rental_package_id", carRentalPackageId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getPricesByCarRentalPackageId(carRentalPackageId: string) {
    return await knex("car_rental_package_prices")
      .where("car_rental_package_id", carRentalPackageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getCurrentPriceByCarRentalPackageId(carRentalPackageId: string, isConstantPrice: boolean) {
    const today = new Date().toISOString().split('T')[0];
    
    if (isConstantPrice) {
      // Sabit fiyat ise ilk fiyatı al
      return await knex("car_rental_package_prices")
        .where("car_rental_package_id", carRentalPackageId)
        .whereNull("deleted_at")
        .orderBy("created_at", "asc")
        .first();
    } else {
      // Tarihli fiyat ise bugünün tarihine uygun fiyatı al
      return await knex("car_rental_package_prices")
        .where("car_rental_package_id", carRentalPackageId)
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

export default CarRentalPackagePriceModel;
