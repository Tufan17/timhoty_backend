import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CarRentalReservationUserModel extends BaseModel {
  constructor() {
    super("car_rental_reservation_users");
  }

  static columns = [
    "id",
    "car_rental_reservation_id",
    "name",
    "surname",
    "birthday",
    "email",
    "phone",
    "type",
    "age",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getUsersByReservationId(reservationId: string) {
    return await knex("car_rental_reservation_users")
      .where("car_rental_reservation_id", reservationId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getUserByEmail(email: string) {
    return await knex("car_rental_reservation_users")
      .where("email", email)
      .whereNull("deleted_at")
      .first();
  }

  async getUserByPhone(phone: string) {
    return await knex("car_rental_reservation_users")
      .where("phone", phone)
      .whereNull("deleted_at")
      .first();
  }

  async getUsersByType(type: string) {
    return await knex("car_rental_reservation_users")
      .where("type", type)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getUsersByReservationAndType(reservationId: string, type: string) {
    return await knex("car_rental_reservation_users")
      .where("car_rental_reservation_id", reservationId)
      .where("type", type)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getUsersWithReservationDetails(reservationId: string) {
    return await knex("car_rental_reservation_users")
      .leftJoin(
        "car_rental_reservations",
        "car_rental_reservation_users.car_rental_reservation_id",
        "car_rental_reservations.id"
      )
      .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
      .leftJoin("car_rental_pivots", function () {
        this.on("car_rentals.id", "=", "car_rental_pivots.car_rental_id").andOn(
          "car_rental_pivots.language_code",
          "=",
          "en"
        );
      })
      .select(
        "car_rental_reservation_users.*",
        "car_rental_reservations.progress_id",
        "car_rental_reservations.start_date",
        "car_rental_reservations.end_date",
        "car_rental_reservations.price",
        "car_rental_reservations.currency_code",
        "car_rental_pivots.title as car_rental_title"
      )
      .where("car_rental_reservation_users.car_rental_reservation_id", reservationId)
      .whereNull("car_rental_reservation_users.deleted_at")
      .orderBy("car_rental_reservation_users.created_at", "desc");
  }

  async getUsersStats() {
    const total = await knex("car_rental_reservation_users")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const adults = await knex("car_rental_reservation_users")
      .where("type", "adult")
      .whereNull("deleted_at")
      .count("id as adults")
      .first();

    const children = await knex("car_rental_reservation_users")
      .where("type", "child")
      .whereNull("deleted_at")
      .count("id as children")
      .first();

    return {
      total: total?.total || 0,
      adults: adults?.adults || 0,
      children: children?.children || 0,
    };
  }

  async getUsersByReservationStats(reservationId: string) {
    const total = await knex("car_rental_reservation_users")
      .where("car_rental_reservation_id", reservationId)
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const adults = await knex("car_rental_reservation_users")
      .where("car_rental_reservation_id", reservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .count("id as adults")
      .first();

    const children = await knex("car_rental_reservation_users")
      .where("car_rental_reservation_id", reservationId)
      .where("type", "child")
      .whereNull("deleted_at")
      .count("id as children")
      .first();

    return {
      total: total?.total || 0,
      adults: adults?.adults || 0,
      children: children?.children || 0,
    };
  }

  async deleteUsersByReservationId(reservationId: string) {
    return await knex("car_rental_reservation_users")
      .where("car_rental_reservation_id", reservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async createMultiple(users: any[]) {
    return await knex("car_rental_reservation_users")
      .insert(users)
      .returning("*");
  }
}

export default CarRentalReservationUserModel;
