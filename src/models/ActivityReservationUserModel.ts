import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class ActivityReservationUserModel extends BaseModel {
  constructor() {
    super("activity_reservation_users");
  }

  static columns = [
    "id",
    "activity_reservation_id",
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

  async getUsersByReservationId(activityReservationId: string) {
    return await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getAdultsByReservationId(activityReservationId: string) {
    return await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getChildrenByReservationId(activityReservationId: string) {
    return await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
      .where("type", "child")
      .whereNull("deleted_at")
      .orderBy("created_at", "asc");
  }

  async getUserByEmail(email: string) {
    return await knex("activity_reservation_users")
      .where("email", email)
      .whereNull("deleted_at")
      .first();
  }

  async getUsersByPhone(phone: string) {
    return await knex("activity_reservation_users")
      .where("phone", phone)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async deleteByReservationId(activityReservationId: string) {
    await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getReservationUserStats(activityReservationId: string) {
    const total = await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const adults = await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
      .where("type", "adult")
      .whereNull("deleted_at")
      .count("id as adults")
      .first();

    const children = await knex("activity_reservation_users")
      .where("activity_reservation_id", activityReservationId)
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

  async getUsersWithReservationDetails(userId: string) {
    return await knex("activity_reservation_users")
      .leftJoin(
        "activity_reservations",
        "activity_reservation_users.activity_reservation_id",
        "activity_reservations.id"
      )
      .leftJoin("activities", "activity_reservations.activity_id", "activities.id")
      .leftJoin("activity_pivots", function () {
        this.on("activities.id", "=", "activity_pivots.activity_id").andOn(
          "activity_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "activity_packages",
        "activity_reservations.package_id",
        "activity_packages.id"
      )
      .leftJoin(
        "activity_package_pivots",
        function () {
          this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id")
            .andOn("activity_package_pivots.language_code", "=", "en");
        }
      )
      .leftJoin(
        "activity_package_hours",
        "activity_reservations.activity_package_hour_id",
        "activity_package_hours.id"
      )
      .leftJoin("users", "activity_reservation_users.id", "users.id")
      .select(
        "activity_reservation_users.*",
        "activity_reservations.status as reservation_status",
        "activity_reservations.payment_id",
        "activity_reservations.created_at as reservation_date",
        "activity_pivots.title as activity_title",
        "activity_package_pivots.name as package_name",
        "activity_package_hours.hour as activity_hour",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "users.phone as user_phone"
      )
      .where("activity_reservation_users.id", userId)
      .whereNull("activity_reservation_users.deleted_at")
      .first();
  }

  async getReservationsByUserEmail(email: string) {
    return await knex("activity_reservation_users")
      .leftJoin(
        "activity_reservations",
        "activity_reservation_users.activity_reservation_id",
        "activity_reservations.id"
      )
      .leftJoin("activities", "activity_reservations.activity_id", "activities.id")
      .leftJoin("activity_pivots", function () {
        this.on("activities.id", "=", "activity_pivots.activity_id").andOn(
          "activity_pivots.language_code",
          "=",
          "en"
        );
      })
      .select(
        "activity_reservation_users.*",
        "activity_reservations.status as reservation_status",
        "activity_reservations.payment_id",
        "activity_reservations.created_at as reservation_date",
        "activity_pivots.title as activity_title"
      )
      .where("activity_reservation_users.email", email)
      .whereNull("activity_reservation_users.deleted_at")
      .whereNull("activity_reservations.deleted_at")
      .orderBy("activity_reservations.created_at", "desc");
  }

  async getReservationsByUserPhone(phone: string) {
    return await knex("activity_reservation_users")
      .leftJoin(
        "activity_reservations",
        "activity_reservation_users.activity_reservation_id",
        "activity_reservations.id"
      )
      .leftJoin("activities", "activity_reservations.activity_id", "activities.id")
      .leftJoin("activity_pivots", function () {
        this.on("activities.id", "=", "activity_pivots.activity_id").andOn(
          "activity_pivots.language_code",
          "=",
          "en"
        );
      })
      .select(
        "activity_reservation_users.*",
        "activity_reservations.status as reservation_status",
        "activity_reservations.payment_id",
        "activity_reservations.created_at as reservation_date",
        "activity_pivots.title as activity_title"
      )
      .where("activity_reservation_users.phone", phone)
      .whereNull("activity_reservation_users.deleted_at")
      .whereNull("activity_reservations.deleted_at")
      .orderBy("activity_reservations.created_at", "desc");
  }

  async createMultipleUsers(users: any[]) {
    return await knex("activity_reservation_users")
      .insert(users)
      .returning("*");
  }

  async updateUserInfo(id: string, userData: any) {
    return await knex("activity_reservation_users")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        ...userData,
        updated_at: new Date(),
      });
  }
}

export default ActivityReservationUserModel;
