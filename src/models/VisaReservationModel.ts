import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class VisaReservationModel extends BaseModel {
  constructor() {
    super("visa_reservations");
  }

  static columns = [
    "id",
    "visa_id",
    "package_id",
    "created_by",
    "sales_partner_id",
    "progress_id",
    "price",
    "currency_code",
    "payment_id",
    "different_invoice",
    "status",
    "date",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getReservationByVisaId(visaId: string) {
    return await knex("visa_reservations")
      .where("visa_id", visaId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByPackageId(packageId: string) {
    return await knex("visa_reservations")
      .where("package_id", packageId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByUserId(userId: string) {
    return await knex("visa_reservations")
      .where("created_by", userId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationBySalesPartnerId(salesPartnerId: string) {
    return await knex("visa_reservations")
      .where("sales_partner_id", salesPartnerId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getReservationByPaymentId(paymentId: string) {
    return await knex("visa_reservations")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("visa_reservations")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        payment_id: paymentId,
        updated_at: new Date(),
      });
  }

  async updateStatus(id: string, status: boolean) {
    return await knex("visa_reservations")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        status: status,
        updated_at: new Date(),
      });
  }

  async getReservationWithDetails(reservationId: string) {
    return await knex("visa_reservations")
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("visa_pivots", function () {
        this.on("visas.id", "=", "visa_pivots.visa_id").andOn(
          "visa_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "visa_packages",
        "visa_reservations.package_id",
        "visa_packages.id"
      )
      .leftJoin(
        "visa_package_prices",
        "visa_packages.id",
        "visa_package_prices.visa_package_id"
      )
      .leftJoin(
        "currencies",
        "visa_package_prices.currency_id",
        "currencies.id"
      )
      .leftJoin("users", "visa_reservations.created_by", "users.id")
      .leftJoin(
        "sales_partners",
        "visa_reservations.sales_partner_id",
        "sales_partners.id"
      )
      .select(
        "visa_reservations.*",
        "visa_pivots.title as visa_title",
        "visa_package_prices.price as package_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "sales_partners.company_name"
      )
      .where("visa_reservations.id", reservationId)
      .whereNull("visa_reservations.deleted_at")
      .first();
  }

  async getReservationsWithDetails(
    where?: any,
    limit?: number,
    offset?: number
  ) {
    let query = knex("visa_reservations")
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("visa_pivots", function () {
        this.on("visas.id", "=", "visa_pivots.visa_id").andOn(
          "visa_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "visa_packages",
        "visa_reservations.package_id",
        "visa_packages.id"
      )
      .leftJoin(
        "visa_package_prices",
        "visa_packages.id",
        "visa_package_prices.visa_package_id"
      )
      .leftJoin(
        "currencies",
        "visa_package_prices.currency_id",
        "currencies.id"
      )
      .leftJoin("users", "visa_reservations.created_by", "users.id")
      .leftJoin(
        "sales_partners",
        "visa_reservations.sales_partner_id",
        "sales_partners.id"
      )
      .select(
        "visa_reservations.*",
        "visa_pivots.title as visa_title",
        "visa_package_prices.price as package_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol",
        "users.first_name",
        "users.last_name",
        "users.email as user_email",
        "sales_partners.company_name"
      )
      .whereNull("visa_reservations.deleted_at");

    if (where) {
      query = query.where(where);
    }

    query = query.orderBy("visa_reservations.created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getReservationStats() {
    const total = await knex("visa_reservations")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const active = await knex("visa_reservations")
      .where("status", true)
      .whereNull("deleted_at")
      .count("id as active")
      .first();

    const pending = await knex("visa_reservations")
      .where("status", false)
      .whereNull("deleted_at")
      .count("id as pending")
      .first();

    const withPayment = await knex("visa_reservations")
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

  // user reservation visa adını istiyorum şehir ve ülkenin adı da olacak ve kaç kişi başvurmuşsa kişi bilgileri de olsun
  async getUserReservation(userId: string, language: string) {
    return await knex("visa_reservations")
      .select(
        "visa_reservations.*",
        "visa_pivots.title as visa_title",
        "city_pivots.name as visa_city",
        "country_pivots.name as visa_country",
        // 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
        knex.raw(`(
          SELECT image_url
          FROM visa_galleries
          WHERE visa_galleries.visa_id = visa_reservations.visa_id
          AND visa_galleries.deleted_at IS NULL
          ORDER BY visa_galleries.created_at ASC
          LIMIT 1
        ) as visa_image`),
        knex.raw(
          "COALESCE(json_agg(DISTINCT jsonb_build_object('id', visa_reservation_users.id, 'name', visa_reservation_users.name, 'surname', visa_reservation_users.surname, 'email', visa_reservation_users.email, 'phone', visa_reservation_users.phone, 'type', visa_reservation_users.type,'age', visa_reservation_users.age)) FILTER (WHERE visa_reservation_users.id IS NOT NULL), '[]'::json) as guests"
        )
      )
      .where("visa_reservations.created_by", userId)
      .where("visa_reservations.status", true)
      .whereNull("visa_reservations.deleted_at")
      .leftJoin("visa_pivots", function () {
        this.on("visa_reservations.visa_id", "=", "visa_pivots.visa_id").andOn(
          "visa_pivots.language_code",
          "=",
          knex.raw("?", [language])
        );
      })
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("cities", "visas.location_id", "cities.id")
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
        "visa_reservation_users",
        "visa_reservations.id",
        "visa_reservation_users.visa_reservation_id"
      )
      .whereNull("visa_reservation_users.deleted_at")
      .groupBy(
        "visa_reservations.id",
        "visa_pivots.title",
        "city_pivots.name",
        "country_pivots.name"
      )
      .orderBy("visa_reservations.created_at", "desc");
  }

  async getUserReservationById(reservationId: string, language: string) {
    // Kullanıcıya ait rezervasyonları, visa adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
    return await knex("visa_reservations")
      .select(
        "visa_reservations.*",
        "visa_pivots.title as visa_title",
        "city_pivots.name as visa_city",
        "country_pivots.name as visa_country",
        // 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
        knex.raw(`(
          SELECT image_url
          FROM visa_galleries
          WHERE visa_galleries.visa_id = visa_reservations.visa_id
          AND visa_galleries.deleted_at IS NULL
          ORDER BY visa_galleries.created_at ASC
          LIMIT 1
        ) as visa_image`),
        knex.raw(
          "COALESCE(json_agg(DISTINCT jsonb_build_object('id', visa_reservation_users.id, 'name', visa_reservation_users.name, 'surname', visa_reservation_users.surname, 'email', visa_reservation_users.email, 'phone', visa_reservation_users.phone, 'type', visa_reservation_users.type,'age', visa_reservation_users.age)) FILTER (WHERE visa_reservation_users.id IS NOT NULL), '[]'::json) as guests"
        )
      )
      .where("visa_reservations.id", reservationId)
      .where("visa_reservations.status", true)
      .whereNull("visa_reservations.deleted_at")
      .leftJoin("visa_pivots", function () {
        this.on("visa_reservations.visa_id", "=", "visa_pivots.visa_id").andOn(
          "visa_pivots.language_code",
          "=",
          knex.raw("?", [language])
        );
      })
      .leftJoin("visas", "visa_reservations.visa_id", "visas.id")
      .leftJoin("cities", "visas.location_id", "cities.id")
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
        "visa_reservation_users",
        "visa_reservations.id",
        "visa_reservation_users.visa_reservation_id"
      )
      .whereNull("visa_reservation_users.deleted_at")
      .groupBy(
        "visa_reservations.id",
        "visa_pivots.title",
        "city_pivots.name",
        "country_pivots.name"
      )
      .orderBy("visa_reservations.created_at", "desc")
      .first();
  }
}

export default VisaReservationModel;
