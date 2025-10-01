import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CarRentalReservationModel extends BaseModel {
  constructor() {
    super("car_rental_reservations");
  }

  static columns = [
    "id",
    "car_rental_id",
    "package_id",
    "created_by",
    "sales_partner_id",
    "progress_id",
    "price",
    "currency_code",
    "payment_id",
    "different_invoice",
    "status",
    "start_date",
    "end_date",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getReservationByCarRentalId(carRentalId: string) {
    return await knex("car_rental_reservations")
      .where("car_rental_id", carRentalId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByPackageId(packageId: string) {
    return await knex("car_rental_reservations")
      .where("package_id", packageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByUserId(userId: string) {
    return await knex("car_rental_reservations")
      .where("created_by", userId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationBySalesPartnerId(salesPartnerId: string) {
    return await knex("car_rental_reservations")
      .where("sales_partner_id", salesPartnerId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByPaymentId(paymentId: string) {
    return await knex("car_rental_reservations")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("car_rental_reservations")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        payment_id: paymentId,
        updated_at: new Date(),
      });
  }

  async updateStatus(id: string, status: boolean) {
    return await knex("car_rental_reservations")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        status: status,
        updated_at: new Date(),
      });
  }

  async getReservationWithDetails(reservationId: string) {
    return await knex("car_rental_reservations")
      .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
      .leftJoin("car_rental_pivots", function () {
        this.on("car_rentals.id", "=", "car_rental_pivots.car_rental_id").andOn(
          "car_rental_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "car_rental_packages",
        "car_rental_reservations.package_id",
        "car_rental_packages.id"
      )
      .leftJoin(
        "car_rental_package_pivots",
        function () {
          this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id")
            .andOn("car_rental_package_pivots.language_code", "=", "en");
        }
      )
      .leftJoin("users", "car_rental_reservations.created_by", "users.id")
      .leftJoin(
        "sales_partners",
        "car_rental_reservations.sales_partner_id",
        "sales_partners.id"
      )
      .select(
        "car_rental_reservations.*",
        "car_rental_pivots.title as car_rental_title",
        "car_rental_package_pivots.name as package_name",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "sales_partners.company_name"
      )
      .where("car_rental_reservations.id", reservationId)
      .whereNull("car_rental_reservations.deleted_at")
      .first();
  }

  async getReservationsWithDetails(
    where?: any,
    limit?: number,
    offset?: number
  ) {
    let query = knex("car_rental_reservations")
      .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
      .leftJoin("car_rental_pivots", function () {
        this.on("car_rentals.id", "=", "car_rental_pivots.car_rental_id").andOn(
          "car_rental_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "car_rental_packages",
        "car_rental_reservations.package_id",
        "car_rental_packages.id"
      )
      .leftJoin(
        "car_rental_package_pivots",
        function () {
          this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id")
            .andOn("car_rental_package_pivots.language_code", "=", "en");
        }
      )
      .leftJoin("users", "car_rental_reservations.created_by", "users.id")
      .leftJoin(
        "sales_partners",
        "car_rental_reservations.sales_partner_id",
        "sales_partners.id"
      )
      .select(
        "car_rental_reservations.*",
        "car_rental_pivots.title as car_rental_title",
        "car_rental_package_pivots.name as package_name",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "sales_partners.company_name"
      )
      .whereNull("car_rental_reservations.deleted_at");

    if (where) {
      query = query.where(where);
    }

    query = query.orderBy("car_rental_reservations.created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getReservationStats() {
    const total = await knex("car_rental_reservations")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const active = await knex("car_rental_reservations")
      .where("status", true)
      .whereNull("deleted_at")
      .count("id as active")
      .first();

    const pending = await knex("car_rental_reservations")
      .where("status", false)
      .whereNull("deleted_at")
      .count("id as pending")
      .first();

    const withPayment = await knex("car_rental_reservations")
      .whereNotNull("payment_id")
      .whereNull("deleted_at")
      .count("id as with_payment")
      .first();

    return {
      total: total?.total || 0,
      active: active?.active || 0,
      pending: pending?.pending || 0,
      with_payment: withPayment?.with_payment || 0,
    };
  }

  // Kullanıcıya ait car rental rezervasyonlarını, car rental adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
  async getUserReservation(userId: string, language: string) {
    try {
      return await knex("car_rental_reservations")
        .select(
          "car_rental_reservations.*",
          "car_rental_pivots.title as car_rental_title",
          "city_pivots.name as car_rental_city",
          "country_pivots.name as car_rental_country",
          "car_rental_package_pivots.name as package_name",
          // 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
          knex.raw(`(
            SELECT image_url
            FROM car_rental_galleries
            WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
            AND car_rental_galleries.deleted_at IS NULL
            ORDER BY car_rental_galleries.created_at ASC
            LIMIT 1
          ) as car_rental_image`),
          knex.raw(
            "COALESCE(json_agg(DISTINCT jsonb_build_object('id', car_rental_reservation_users.id, 'name', car_rental_reservation_users.name, 'surname', car_rental_reservation_users.surname, 'email', car_rental_reservation_users.email, 'phone', car_rental_reservation_users.phone, 'type', car_rental_reservation_users.type,'age', car_rental_reservation_users.age)) FILTER (WHERE car_rental_reservation_users.id IS NOT NULL), '[]'::json) as guests"
          )
        )
        .where("car_rental_reservations.created_by", userId)
        .where("car_rental_reservations.status", true)
        .whereNull("car_rental_reservations.deleted_at")
        .leftJoin("car_rental_pivots", function () {
          this.on("car_rental_reservations.car_rental_id", "=", "car_rental_pivots.car_rental_id").andOn(
            "car_rental_pivots.language_code",
            "=",
            knex.raw("?", [language])
          );
        })
        .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
        .leftJoin("cities", "car_rentals.location_id", "cities.id")
        .leftJoin("city_pivots", function () {
          this.on("cities.id", "=", "city_pivots.city_id").andOn(
            "city_pivots.language_code",
            "=",
            knex.raw("?", [language])
          );
        })
        .leftJoin("countries", "cities.country_id", "countries.id")
        .leftJoin("country_pivots", function () {
          this.on("countries.id", "=", "country_pivots.country_id").andOn(
            "country_pivots.language_code",
            "=",
            knex.raw("?", [language])
          );
        })
        .leftJoin(
          "car_rental_packages",
          "car_rental_reservations.package_id",
          "car_rental_packages.id"
        )
        .leftJoin(
          "car_rental_package_pivots",
          function () {
            this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id")
              .andOn("car_rental_package_pivots.language_code", "=", knex.raw("?", [language]));
          }
        )
        .leftJoin(
          "car_rental_reservation_users",
          "car_rental_reservations.id",
          "car_rental_reservation_users.car_rental_reservation_id"
        )
        .whereNull("car_rental_reservation_users.deleted_at")
        .groupBy(
          "car_rental_reservations.id",
          "car_rental_pivots.title",
          "city_pivots.name",
          "country_pivots.name",
          "car_rental_package_pivots.name"
        )
        .orderBy("car_rental_reservations.created_at", "desc");
    } catch (error) {
      console.error("Car Rental Reservation Error:", error);
      return [];
    }
  }

  async getUserReservationById(reservationId: string, language: string) {
    // Kullanıcıya ait rezervasyonu, car rental adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
    return await knex("car_rental_reservations")
      .select(
        "car_rental_reservations.*",
        "car_rental_pivots.title as car_rental_title",
        "city_pivots.name as car_rental_city",
        "country_pivots.name as car_rental_country",
        "car_rental_package_pivots.name as package_name",
        // 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
        knex.raw(`(
          SELECT image_url
          FROM car_rental_galleries
          WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
          AND car_rental_galleries.deleted_at IS NULL
          ORDER BY car_rental_galleries.created_at ASC
          LIMIT 1
        ) as car_rental_image`),
        knex.raw(
          "COALESCE(json_agg(DISTINCT jsonb_build_object('id', car_rental_reservation_users.id, 'name', car_rental_reservation_users.name, 'surname', car_rental_reservation_users.surname, 'email', car_rental_reservation_users.email, 'phone', car_rental_reservation_users.phone, 'type', car_rental_reservation_users.type,'age', car_rental_reservation_users.age)) FILTER (WHERE car_rental_reservation_users.id IS NOT NULL), '[]'::json) as guests"
        )
      )
      .where("car_rental_reservations.id", reservationId)
      .where("car_rental_reservations.status", true)
      .whereNull("car_rental_reservations.deleted_at")
      .leftJoin("car_rental_pivots", function () {
        this.on("car_rental_reservations.car_rental_id", "=", "car_rental_pivots.car_rental_id").andOn(
          "car_rental_pivots.language_code",
          "=",
          knex.raw("?", [language])
        );
      })
      .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
      .leftJoin("cities", "car_rentals.location_id", "cities.id")
      .leftJoin("city_pivots", function () {
        this.on("cities.id", "=", "city_pivots.city_id").andOn(
          "city_pivots.language_code",
          "=",
          knex.raw("?", [language])
        );
      })
      .leftJoin("countries", "cities.country_id", "countries.id")
      .leftJoin("country_pivots", function () {
        this.on("countries.id", "=", "country_pivots.country_id").andOn(
          "country_pivots.language_code",
          "=",
          knex.raw("?", [language])
        );
      })
      .leftJoin(
        "car_rental_packages",
        "car_rental_reservations.package_id",
        "car_rental_packages.id"
      )
      .leftJoin(
        "car_rental_package_pivots",
        function () {
          this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id")
            .andOn("car_rental_package_pivots.language_code", "=", knex.raw("?", [language]));
        }
      )
      .leftJoin(
        "car_rental_reservation_users",
        "car_rental_reservations.id",
        "car_rental_reservation_users.car_rental_reservation_id"
      )
      .whereNull("car_rental_reservation_users.deleted_at")
      .groupBy(
        "car_rental_reservations.id",
        "car_rental_pivots.title",
        "city_pivots.name",
        "country_pivots.name",
        "car_rental_package_pivots.name"
      )
      .orderBy("car_rental_reservations.created_at", "desc")
      .first();
  }
}

export default CarRentalReservationModel;
