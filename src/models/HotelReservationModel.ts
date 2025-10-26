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
    'start_date',
    'end_date',
    'check_in_date',
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

  // user reservation ben otelin adını istiyorum şehir ve ülkenin adı da olacak ve kaç kişi kalmışsa kişi bilgileri de olsun
  async getUserReservation(userId: string, language: string) {
    return await knex("hotel_reservations")
      .select(
        "hotel_reservations.*",
        "hotel_pivots.name as hotel_name",
        "city_pivots.name as hotel_city",
        "country_pivots.name as hotel_country",

        // Oda ve paket bilgisi
        "hotel_rooms.id as room_id",
        "hotel_room_pivots.name as room_name",
        "hotel_room_packages.id as package_id",
        "hotels.refund_days as hotel_refund_days",
        "hotel_rooms.refund_days as room_refund_days",

        // 1 adet fotoğraf (ilk eklenen)
        knex.raw(`(
          SELECT image_url
          FROM hotel_galleries
          WHERE hotel_galleries.hotel_id = hotel_reservations.hotel_id
            AND hotel_galleries.deleted_at IS NULL
          ORDER BY hotel_galleries.created_at ASC
          LIMIT 1
        ) AS hotel_image`),

        // Misafirler (null kaydı eklenmesin diye FILTER kullandık)
        knex.raw(`
          json_agg(DISTINCT jsonb_build_object(
            'id', hotel_reservation_users.id,
            'name', hotel_reservation_users.name,
            'surname', hotel_reservation_users.surname,
            'email', hotel_reservation_users.email,
            'phone', hotel_reservation_users.phone,
            'type', hotel_reservation_users.type,
            'age', hotel_reservation_users.age,
            'birthday', hotel_reservation_users.birthday
          )) FILTER (WHERE hotel_reservation_users.id IS NOT NULL) AS guests
        `),

        // Tek bir yorum (ör. en son eklenen)
        knex.raw(`(
          SELECT to_jsonb(c)
          FROM comments c
          WHERE c.reservation_id = hotel_reservations.id
            AND c.deleted_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT 1
        ) AS comment`),

        // Fatura bilgileri
        knex.raw(`(
          SELECT to_jsonb(hri)
          FROM hotel_reservation_invoices hri
          WHERE hri.hotel_reservation_id = hotel_reservations.id
            AND hri.deleted_at IS NULL
          LIMIT 1
        ) AS invoice`),

        // Özel istekler
        knex.raw(`(
          SELECT COALESCE(json_agg(hrsr.request), '[]'::json)
          FROM hotel_reservation_special_requests hrsr
          WHERE hrsr.hotel_reservation_id = hotel_reservations.id
            AND hrsr.deleted_at IS NULL
        ) AS special_requests`)
      )
      .where("hotel_reservations.created_by", userId)
      .where("hotel_reservations.status", true)
      .whereNull("hotel_reservations.deleted_at")

      .leftJoin("hotel_pivots", function () {
        this.on("hotel_reservations.hotel_id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("cities", "hotels.location_id", "cities.id")
      .leftJoin("city_pivots", function () {
        this.on("cities.id", "=", "city_pivots.city_id")
          .andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("countries", "cities.country_id", "countries.id")
      .leftJoin("country_pivots", function () {
        this.on("countries.id", "=", "country_pivots.country_id")
          .andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin(
        "hotel_reservation_users",
        "hotel_reservations.id",
        "hotel_reservation_users.hotel_reservation_id"
      )
      // Oda ve paket joinleri
      .leftJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
      .leftJoin("hotel_rooms", "hotel_room_packages.hotel_room_id", "hotel_rooms.id")
      .leftJoin("hotel_room_pivots", function () {
        this.on("hotel_rooms.id", "=", "hotel_room_pivots.hotel_room_id")
          .andOn("hotel_room_pivots.language_code", "=", knex.raw("?", [language]));
      })
      // Silinmiş misafirleri dahil etme
      .whereNull("hotel_reservation_users.deleted_at")

      .groupBy(
        "hotel_reservations.id",
        "hotel_pivots.name",
        "city_pivots.name",
        "country_pivots.name",
        "hotel_rooms.id",
        "hotel_room_pivots.name",
        "hotel_room_packages.id",
        "hotels.refund_days",
        "hotel_rooms.refund_days"
      )
      .orderBy("hotel_reservations.created_at", "desc");
  }
  

  async getUserReservationById(reservationId: string, language: string) {
    // Kullanıcıya ait rezervasyonları, otel adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
    return await knex("hotel_reservations")
      .select(
        "hotel_reservations.*",
        "hotel_pivots.name as hotel_name",
        "city_pivots.name as hotel_city",
        "country_pivots.name as hotel_country",

        // Oda ve paket bilgisi
        "hotel_rooms.id as room_id",
        "hotel_room_pivots.name as room_name",
        "hotel_room_packages.id as package_id",
        "hotels.refund_days as hotel_refund_days",
        "hotel_rooms.refund_days as room_refund_days",

        // 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
        knex.raw(`(
          SELECT image_url
          FROM hotel_galleries
          WHERE hotel_galleries.hotel_id = hotel_reservations.hotel_id
          AND hotel_galleries.deleted_at IS NULL
          ORDER BY hotel_galleries.created_at ASC
          LIMIT 1
        ) as hotel_image`),
        knex.raw("json_agg(DISTINCT jsonb_build_object('id', hotel_reservation_users.id, 'name', hotel_reservation_users.name, 'surname', hotel_reservation_users.surname, 'email', hotel_reservation_users.email, 'phone', hotel_reservation_users.phone, 'type', hotel_reservation_users.type,'age', hotel_reservation_users.age, 'birthday', hotel_reservation_users.birthday)) as guests"),

        // Fatura bilgileri
        knex.raw(`(
          SELECT to_jsonb(hri)
          FROM hotel_reservation_invoices hri
          WHERE hri.hotel_reservation_id = hotel_reservations.id
            AND hri.deleted_at IS NULL
          LIMIT 1
        ) AS invoice`),

        // Özel istekler
        knex.raw(`(
          SELECT COALESCE(json_agg(hrsr.request), '[]'::json)
          FROM hotel_reservation_special_requests hrsr
          WHERE hrsr.hotel_reservation_id = hotel_reservations.id
            AND hrsr.deleted_at IS NULL
        ) AS special_requests`)
      )
      .where("hotel_reservations.id", reservationId)
      .where("hotel_reservations.status", true)
      .whereNull("hotel_reservations.deleted_at")
      .leftJoin("hotel_pivots", function() {
        this.on("hotel_reservations.hotel_id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("cities", "hotels.location_id", "cities.id")
      .leftJoin("city_pivots", function() {
        this.on("cities.id", "=", "city_pivots.city_id")
          .andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("countries", "cities.country_id", "countries.id")
      .leftJoin("country_pivots", function() {
        this.on("countries.id", "=", "country_pivots.country_id")
          .andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
      .leftJoin("hotel_rooms", "hotel_room_packages.hotel_room_id", "hotel_rooms.id")
      .leftJoin("hotel_room_pivots", function() {
        this.on("hotel_rooms.id", "=", "hotel_room_pivots.hotel_room_id")
          .andOn("hotel_room_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotel_reservation_users", "hotel_reservations.id", "hotel_reservation_users.hotel_reservation_id")
      .whereNull("hotel_reservation_users.deleted_at")
      .groupBy(
        "hotel_reservations.id",
        "hotel_pivots.name",
        "city_pivots.name",
        "country_pivots.name",
        "hotel_rooms.id",
        "hotel_room_pivots.name",
        "hotel_room_packages.id",
        "hotels.refund_days",
        "hotel_rooms.refund_days"
      )
      .orderBy("hotel_reservations.created_at", "desc")
      .first();
  }

  async getSalesPartnerReservationById(reservationId: string, language: string) {
    // Kullanıcıya ait rezervasyonları, otel adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
    return await knex("hotel_reservations")
      .select(
        "hotel_reservations.*",
        "hotel_pivots.name as hotel_name",
        "city_pivots.name as hotel_city",
        "country_pivots.name as hotel_country",

        // Oda ve paket bilgisi
        "hotel_rooms.id as room_id",
        "hotel_room_pivots.name as room_name",
        "hotel_room_packages.id as package_id",
        "hotels.refund_days as hotel_refund_days",
        "hotel_rooms.refund_days as room_refund_days",

        // 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
        knex.raw(`(
          SELECT image_url
          FROM hotel_galleries
          WHERE hotel_galleries.hotel_id = hotel_reservations.hotel_id
          AND hotel_galleries.deleted_at IS NULL
          ORDER BY hotel_galleries.created_at ASC
          LIMIT 1
        ) as hotel_image`),
        knex.raw("json_agg(DISTINCT jsonb_build_object('id', hotel_reservation_users.id, 'name', hotel_reservation_users.name, 'surname', hotel_reservation_users.surname, 'email', hotel_reservation_users.email, 'phone', hotel_reservation_users.phone, 'type', hotel_reservation_users.type,'age', hotel_reservation_users.age, 'birthday', hotel_reservation_users.birthday)) as guests"),

        // Fatura bilgileri
        knex.raw(`(
          SELECT to_jsonb(hri)
          FROM hotel_reservation_invoices hri
          WHERE hri.hotel_reservation_id = hotel_reservations.id
            AND hri.deleted_at IS NULL
          LIMIT 1
        ) AS invoice`),

        // Özel istekler
        knex.raw(`(
          SELECT COALESCE(json_agg(hrsr.request), '[]'::json)
          FROM hotel_reservation_special_requests hrsr
          WHERE hrsr.hotel_reservation_id = hotel_reservations.id
            AND hrsr.deleted_at IS NULL
        ) AS special_requests`)
      )
      .where("hotel_reservations.id", reservationId)
      .where("hotel_reservations.status", true)
      .whereNull("hotel_reservations.deleted_at")
      .leftJoin("hotel_pivots", function() {
        this.on("hotel_reservations.hotel_id", "=", "hotel_pivots.hotel_id")
          .andOn("hotel_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
      .leftJoin("cities", "hotels.location_id", "cities.id")
      .leftJoin("city_pivots", function() {
        this.on("cities.id", "=", "city_pivots.city_id")
          .andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("countries", "cities.country_id", "countries.id")
      .leftJoin("country_pivots", function() {
        this.on("countries.id", "=", "country_pivots.country_id")
          .andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
      .leftJoin("hotel_rooms", "hotel_room_packages.hotel_room_id", "hotel_rooms.id")
      .leftJoin("hotel_room_pivots", function() {
        this.on("hotel_rooms.id", "=", "hotel_room_pivots.hotel_room_id")
          .andOn("hotel_room_pivots.language_code", "=", knex.raw("?", [language]));
      })
      .leftJoin("hotel_reservation_users", "hotel_reservations.id", "hotel_reservation_users.hotel_reservation_id")
      .whereNull("hotel_reservation_users.deleted_at")
      .groupBy(
        "hotel_reservations.id",
        "hotel_pivots.name",
        "city_pivots.name",
        "country_pivots.name",
        "hotel_rooms.id",
        "hotel_room_pivots.name",
        "hotel_room_packages.id",
        "hotels.refund_days",
        "hotel_rooms.refund_days"
      )
      .orderBy("hotel_reservations.created_at", "desc")
      .first();
  }



}

export default HotelReservationModel;
