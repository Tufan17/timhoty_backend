import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class VisaReservationUserModel extends BaseModel {
  constructor() {
    super("visa_reservation_users");
  }

  static columns = [
    'id',
    'visa_reservation_id',
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

  async getUsersByReservationId(visaReservationId: string) {
    return await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getAdultsByReservationId(visaReservationId: string) {
    return await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getChildrenByReservationId(visaReservationId: string) {
    return await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
      .where("type", "child")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getUserByEmail(email: string) {
    return await knex("visa_reservation_users")
      .where("email", email)
      .whereNull("deleted_at")
      .first();
  }

  async getUsersByPhone(phone: string) {
    return await knex("visa_reservation_users")
      .where("phone", phone)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async deleteByReservationId(visaReservationId: string) {
    await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getReservationUserStats(visaReservationId: string) {
    const total = await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const adults = await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .count("id as adults")
      .first();

    const children = await knex("visa_reservation_users")
      .where("visa_reservation_id", visaReservationId)
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
    return await knex("visa_reservation_users")
      .leftJoin("visa_reservations", "visa_reservation_users.visa_reservation_id", "visa_reservations.id")
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("visa_pivots", function() {
        this.on("visas.id", "=", "visa_pivots.visa_id")
          .andOn("visa_pivots.language_code", "=", "en");
      })
      .leftJoin("visa_packages", "visa_reservations.package_id", "visa_packages.id")
      .leftJoin("visa_package_prices", "visa_packages.id", "visa_package_prices.visa_package_id")
      .leftJoin("currencies", "visa_package_prices.currency_id", "currencies.id")
      .select(
        "visa_reservation_users.*",
        "visa_reservations.status as reservation_status",
        "visa_reservations.payment_id",
        "visa_reservations.created_at as reservation_date",
        "visa_pivots.title as visa_title",
        "visa_package_prices.price as package_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol"
      )
      .where("visa_reservation_users.id", userId)
      .whereNull("visa_reservation_users.deleted_at")
      .first();
  }

  async getReservationsByUserEmail(email: string) {
    return await knex("visa_reservation_users")
      .leftJoin("visa_reservations", "visa_reservation_users.visa_reservation_id", "visa_reservations.id")
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("visa_pivots", function() {
        this.on("visas.id", "=", "visa_pivots.visa_id")
          .andOn("visa_pivots.language_code", "=", "en");
      })
      .select(
        "visa_reservation_users.*",
        "visa_reservations.status as reservation_status",
        "visa_reservations.payment_id",
        "visa_reservations.created_at as reservation_date",
        "visa_pivots.title as visa_title"
      )
      .where("visa_reservation_users.email", email)
      .whereNull("visa_reservation_users.deleted_at")
      .whereNull("visa_reservations.deleted_at")
      .orderBy("visa_reservations.created_at", "desc");
  }

  async getReservationsByUserPhone(phone: string) {
    return await knex("visa_reservation_users")
      .leftJoin("visa_reservations", "visa_reservation_users.visa_reservation_id", "visa_reservations.id")
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("visa_pivots", function() {
        this.on("visas.id", "=", "visa_pivots.visa_id")
          .andOn("visa_pivots.language_code", "=", "en");
      })
      .select(
        "visa_reservation_users.*",
        "visa_reservations.status as reservation_status",
        "visa_reservations.payment_id",
        "visa_reservations.created_at as reservation_date",
        "visa_pivots.title as visa_title"
      )
      .where("visa_reservation_users.phone", phone)
      .whereNull("visa_reservation_users.deleted_at")
      .whereNull("visa_reservations.deleted_at")
      .orderBy("visa_reservations.created_at", "desc");
  }

  async createMultipleUsers(users: any[]) {
    return await knex("visa_reservation_users")
      .insert(users)
      .returning("*");
  }

  async updateUserInfo(id: string, userData: any) {
    return await knex("visa_reservation_users")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        ...userData,
        updated_at: new Date()
      });
  }
}

export default VisaReservationUserModel;
