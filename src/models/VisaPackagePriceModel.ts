import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class VisaPackagePriceModel extends BaseModel {
  constructor() {
    super("visa_package_prices");
  }
  static columns = [
    'id',
    'visa_package_id',
    'main_price',
    'child_price',
    'currency_id',
    'start_date',
    'end_date',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async deleteByVisaPackageId(visaPackageId: string) {
    await knex("visa_package_prices")
      .where("visa_package_id", visaPackageId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getPricesByVisaPackageId(visaPackageId: string) {
    return await knex("visa_package_prices")
      .where("visa_package_id", visaPackageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getCurrentPriceByVisaPackageId(visaPackageId: string, isConstantPrice: boolean) {
    const today = new Date().toISOString().split('T')[0];
    
    if (isConstantPrice) {
      // Sabit fiyat ise ilk fiyatı al
      return await knex("visa_package_prices")
        .where("visa_package_id", visaPackageId)
        .whereNull("deleted_at")
        .orderBy("created_at", "asc")
        .first();
    } else {
      // Tarihli fiyat ise bugünün tarihine uygun fiyatı al
      return await knex("visa_package_prices")
        .where("visa_package_id", visaPackageId)
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

export default VisaPackagePriceModel;