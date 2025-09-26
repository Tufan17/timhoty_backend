import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class HotelReservationUserModel extends BaseModel {
  constructor() {
    super("hotel_reservation_users");
  }

  static columns = [
    'id',
    'hotel_reservation_id',
    'name',
    'surname',
    'birthday',
    'email',
    'phone',
    'type',
    'age',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getUsersByReservationId(hotelReservationId: string) {
    return await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getAdultsByReservationId(hotelReservationId: string) {
    return await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getChildrenByReservationId(hotelReservationId: string) {
    return await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .where("type", "child")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getUserByEmail(email: string) {
    return await knex("hotel_reservation_users")
      .where("email", email)
      .whereNull("deleted_at")
      .first();
  }

  async getUsersByPhone(phone: string) {
    return await knex("hotel_reservation_users")
      .where("phone", phone)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async deleteByReservationId(hotelReservationId: string) {
    await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getReservationUserStats(hotelReservationId: string) {
    const total = await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const adults = await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .count("id as adults")
      .first();

    const children = await knex("hotel_reservation_users")
      .where("hotel_reservation_id", hotelReservationId)
      .where("type", "child")
      .whereNull("deleted_at")
      .count("id as children")
      .first();

    return {
      total: total?.total || 0,
      adults: adults?.adults || 0,
      children: children?.children || 0
    };
  }

  async getUsersWithReservationDetails(userId: string) {
    return await knex("hotel_reservation_users")
      .leftJoin("hotel_reservations", "hotel_reservation_users.hotel_reservation_id", "hotel_reservations.id")
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("hotel_pivots", function() {
        this.on("hotels.id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", "en");
      })
      .leftJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
      .leftJoin("hotel_room_package_prices", "hotel_room_packages.id", "hotel_room_package_prices.hotel_room_package_id")
      .leftJoin("currencies", "hotel_room_package_prices.currency_id", "currencies.id")
      .select(
        "hotel_reservation_users.*",
        "hotel_reservations.status as reservation_status",
        "hotel_reservations.payment_id",
        "hotel_reservations.created_at as reservation_date",
        "hotel_pivots.name as hotel_name",
        "hotel_room_package_prices.main_price",
        "hotel_room_package_prices.child_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol"
      )
      .where("hotel_reservation_users.id", userId)
      .whereNull("hotel_reservation_users.deleted_at")
      .first();
  }

  async getReservationsByUserEmail(email: string) {
    return await knex("hotel_reservation_users")
      .leftJoin("hotel_reservations", "hotel_reservation_users.hotel_reservation_id", "hotel_reservations.id")
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("hotel_pivots", function() {
        this.on("hotels.id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", "en");
      })
      .select(
        "hotel_reservation_users.*",
        "hotel_reservations.status as reservation_status",
        "hotel_reservations.payment_id",
        "hotel_reservations.created_at as reservation_date",
        "hotel_pivots.name as hotel_name"
      )
      .where("hotel_reservation_users.email", email)
      .whereNull("hotel_reservation_users.deleted_at")
      .whereNull("hotel_reservations.deleted_at")
      .orderBy("hotel_reservations.created_at", "desc");
  }

  async getReservationsByUserPhone(phone: string) {
    return await knex("hotel_reservation_users")
      .leftJoin("hotel_reservations", "hotel_reservation_users.hotel_reservation_id", "hotel_reservations.id")
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("hotel_pivots", function() {
        this.on("hotels.id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", "en");
      })
      .select(
        "hotel_reservation_users.*",
        "hotel_reservations.status as reservation_status",
        "hotel_reservations.payment_id",
        "hotel_reservations.created_at as reservation_date",
        "hotel_pivots.name as hotel_name"
      )
      .where("hotel_reservation_users.phone", phone)
      .whereNull("hotel_reservation_users.deleted_at")
      .whereNull("hotel_reservations.deleted_at")
      .orderBy("hotel_reservations.created_at", "desc");
  }

  async createMultipleUsers(users: any[]) {
    return await knex("hotel_reservation_users")
      .insert(users)
      .returning("*");
  }

  async updateUserInfo(id: string, userData: any) {
    return await knex("hotel_reservation_users")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        ...userData,
        updated_at: new Date()
      });
  }
}

export default HotelReservationUserModel;
