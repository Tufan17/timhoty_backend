import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class HotelReservationModel extends BaseModel {
  constructor() {
    super("hotel_reservations");
  }

  static columns = [
    'id',
    'hotel_id',
    'package_id',
    'created_by',
    'sales_partner_id',
    'progress_id',
    'payment_id',
    'different_invoice',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getReservationByHotelId(hotelId: string) {
    return await knex("hotel_reservations")
      .where("hotel_id", hotelId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByPackageId(packageId: string) {
    return await knex("hotel_reservations")
      .where("package_id", packageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByUserId(userId: string) {
    return await knex("hotel_reservations")
      .where("created_by", userId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationBySalesPartnerId(salesPartnerId: string) {
    return await knex("hotel_reservations")
      .where("sales_partner_id", salesPartnerId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByPaymentId(paymentId: string) {
    return await knex("hotel_reservations")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("hotel_reservations")
      .where("id", id)
      .whereNull("deleted_at")
      .update({ 
        payment_id: paymentId,
        updated_at: new Date() 
      });
  }

  async updateStatus(id: string, status: boolean) {
    return await knex("hotel_reservations")
      .where("id", id)
      .whereNull("deleted_at")
      .update({ 
        status: status,
        updated_at: new Date() 
      });
  }

  async getReservationWithDetails(reservationId: string) {
    return await knex("hotel_reservations")
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("hotel_pivots", function() {
        this.on("hotels.id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", "en");
      })
      .leftJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
      .leftJoin("hotel_room_package_prices", "hotel_room_packages.id", "hotel_room_package_prices.hotel_room_package_id")
      .leftJoin("currencies", "hotel_room_package_prices.currency_id", "currencies.id")
      .leftJoin("users", "hotel_reservations.created_by", "users.id")
      .leftJoin("sales_partners", "hotel_reservations.sales_partner_id", "sales_partners.id")
      .select(
        "hotel_reservations.*",
        "hotel_pivots.name as hotel_name",
        "hotel_room_package_prices.main_price",
        "hotel_room_package_prices.child_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "sales_partners.company_name"
      )
      .where("hotel_reservations.id", reservationId)
      .whereNull("hotel_reservations.deleted_at")
      .first();
  }

  async getReservationsWithDetails(where?: any, limit?: number, offset?: number) {
    let query = knex("hotel_reservations")
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("hotel_pivots", function() {
        this.on("hotels.id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", "en");
      })
      .leftJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
      .leftJoin("hotel_room_package_prices", "hotel_room_packages.id", "hotel_room_package_prices.hotel_room_package_id")
      .leftJoin("currencies", "hotel_room_package_prices.currency_id", "currencies.id")
      .leftJoin("users", "hotel_reservations.created_by", "users.id")
      .leftJoin("sales_partners", "hotel_reservations.sales_partner_id", "sales_partners.id")
      .select(
        "hotel_reservations.*",
        "hotel_pivots.name as hotel_name",
        "hotel_room_package_prices.main_price",
        "hotel_room_package_prices.child_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "sales_partners.company_name"
      )
      .whereNull("hotel_reservations.deleted_at");

    if (where) {
      query = query.where(where);
    }

    query = query.orderBy("hotel_reservations.created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getReservationStats() {
    const total = await knex("hotel_reservations")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const active = await knex("hotel_reservations")
      .where("status", true)
      .whereNull("deleted_at")
      .count("id as active")
      .first();

    const pending = await knex("hotel_reservations")
      .where("status", false)
      .whereNull("deleted_at")
      .count("id as pending")
      .first();

    const withPayment = await knex("hotel_reservations")
      .whereNotNull("payment_id")
      .whereNull("deleted_at")
      .count("id as with_payment")
      .first();

    return {
      total: total?.total || 0,
      active: active?.active || 0,
      pending: pending?.pending || 0,
      with_payment: withPayment?.with_payment || 0
    };
  }
}

export default HotelReservationModel;
