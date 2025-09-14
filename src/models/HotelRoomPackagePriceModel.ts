import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class HotelRoomPackagePriceModel extends BaseModel {
  constructor() {
    super("hotel_room_package_prices");
  }
  static columns = [
    'id',
    'hotel_room_package_id',
    'main_price',
    'child_price',
    'currency_id',
    'start_date',
    'end_date',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
  async deleteByHotelRoomPackageId(hotelRoomPackageId: string) {
    await knex("hotel_room_package_prices")
      .where("hotel_room_package_id", hotelRoomPackageId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getPricesByHotelRoomPackageId(hotelRoomPackageId: string) {
    return await knex("hotel_room_package_prices")
      .where("hotel_room_package_id", hotelRoomPackageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getCurrentPriceByHotelRoomPackageId(hotelRoomPackageId: string, isConstantPrice: boolean) {
    const today = new Date().toISOString().split('T')[0];
    
    if (isConstantPrice) {
      // Sabit fiyat ise ilk fiyatı al
      return await knex("hotel_room_package_prices")
        .where("hotel_room_package_id", hotelRoomPackageId)
        .whereNull("deleted_at")
        .orderBy("created_at", "asc")
        .first();
    } else {
      // Tarihli fiyat ise bugünün tarihine uygun fiyatı al
      return await knex("hotel_room_package_prices")
        .where("hotel_room_package_id", hotelRoomPackageId)
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

export default HotelRoomPackagePriceModel;