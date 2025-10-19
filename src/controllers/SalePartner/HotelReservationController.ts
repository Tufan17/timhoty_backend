import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class HotelReservationController {
  async getSalesPartnerReservations(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        hotel_id,
        start_date,
        end_date,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        status?: boolean;
        hotel_id?: string;
        start_date?: string;
        end_date?: string;
      };

      const language = (req as any).language;
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Base query - sales partner'a ait rezervasyonlar
      const base = knex("hotel_reservations")
        .where("hotel_reservations.status", true)
        .whereNull("hotel_reservations.deleted_at")
        .where("hotel_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .innerJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
        .innerJoin("hotel_room_package_prices", "hotel_room_packages.id", "hotel_room_package_prices.hotel_room_package_id")
        .innerJoin("currencies", "hotel_room_package_prices.currency_id", "currencies.id")
        .leftJoin("users", "hotel_reservations.created_by", "users.id")
        .leftJoin("cities", "hotels.location_id", "cities.id")
        .leftJoin("city_pivots", function () {
          this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
        })
        .leftJoin("countries", "cities.country_id", "countries.id")
        .leftJoin("country_pivots", function () {
          this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
        })
        .where("hotel_pivots.language_code", language)
        .whereNull("hotels.deleted_at")
        .whereNull("hotel_pivots.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .whereNull("hotel_room_package_prices.deleted_at")
        .modify((qb) => {
          if (typeof status !== "undefined") {
            qb.where("hotel_reservations.status", status);
          }
          if (hotel_id) {
            qb.where("hotel_reservations.hotel_id", hotel_id);
          }
          if (start_date) {
            qb.where("hotel_reservations.start_date", ">=", start_date);
          }
          if (end_date) {
            qb.where("hotel_reservations.end_date", "<=", end_date);
          }
          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_pivots.name", "ilike", like)
                .orWhere("hotel_reservations.progress_id", "ilike", like)
                .orWhere("users.name_surname", "ilike", like)
                .orWhere("users.email", "ilike", like);
            });
          }
        });

      // Total count
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .count<{ total: string }>("hotel_reservations.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Data selection
      const data = await base
        .clone()
        .select(
          "hotel_reservations.id",
          "hotel_reservations.hotel_id",
          "hotel_reservations.package_id",
          "hotel_reservations.created_by",
          "hotel_reservations.sales_partner_id",
          "hotel_reservations.progress_id",
          "hotel_reservations.price",
          "hotel_reservations.currency_code",
          "hotel_reservations.payment_id",
          "hotel_reservations.different_invoice",
          "hotel_reservations.status",
          "hotel_reservations.start_date",
          "hotel_reservations.end_date",
          "hotel_reservations.check_in_date",
          "hotel_reservations.created_at",
          "hotel_reservations.updated_at",
          "hotel_pivots.name as hotel_name",
          "hotel_room_package_prices.main_price",
          "hotel_room_package_prices.child_price",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone",
          "city_pivots.name as city_name",
          "country_pivots.name as country_name",
        )
        .orderBy("hotel_reservations.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
        data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }

  async getReservationById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const reservation = await knex("hotel_reservations")
        .whereNull("hotel_reservations.deleted_at")
        .where("hotel_reservations.id", id)
        .where("hotel_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .innerJoin("hotel_room_packages", "hotel_reservations.package_id", "hotel_room_packages.id")
        .innerJoin("hotel_room_package_prices", "hotel_room_packages.id", "hotel_room_package_prices.hotel_room_package_id")
        .innerJoin("currencies", "hotel_room_package_prices.currency_id", "currencies.id")
        .leftJoin("users", "hotel_reservations.created_by", "users.id")
        .where("hotel_pivots.language_code", language)
        .whereNull("hotels.deleted_at")
        .whereNull("hotel_pivots.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .whereNull("hotel_room_package_prices.deleted_at")
        .select(
          "hotel_reservations.*",
          "hotel_pivots.name as hotel_name",
          "hotel_room_package_prices.main_price",
          "hotel_room_package_prices.child_price",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone"
        )
        .first();

      if (!reservation) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      // Get reservation users
      const reservationUsers = await knex("hotel_reservation_users")
        .where("hotel_reservation_users.hotel_reservation_id", id)
        .whereNull("hotel_reservation_users.deleted_at")
        .select("*");

      reservation.users = reservationUsers;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }
}
