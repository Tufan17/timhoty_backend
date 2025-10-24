import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import CarRentalReservationModel from "@/models/CarRentalReservationModel";

export default class CarRentalReservationController {
  async getSalesPartnerReservations(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        car_rental_id,
        start_date,
        end_date,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        status?: boolean;
        car_rental_id?: string;
        start_date?: string;
        end_date?: string;
      };

      const language = (req as any).language || "en";
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Base query - sales partner'a ait rezervasyonlar
      const base = knex("car_rental_reservations")
        .where("car_rental_reservations.status", true)
        .whereNull("car_rental_reservations.deleted_at")
        .where("car_rental_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
        .innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
        .innerJoin("car_rental_packages", "car_rental_reservations.package_id", "car_rental_packages.id")
        .innerJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
        .innerJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
        .leftJoin("users", "car_rental_reservations.created_by", "users.id")
        .leftJoin("cities", "car_rentals.location_id", "cities.id")
        .leftJoin("city_pivots", function () {
          this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
        })
        .leftJoin("countries", "cities.country_id", "countries.id")
        .leftJoin("country_pivots", function () {
          this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
        })
        .where("car_rental_pivots.language_code", language)
        .whereNull("car_rentals.deleted_at")
        .whereNull("car_rental_pivots.deleted_at")
        .whereNull("car_rental_packages.deleted_at")
        .whereNull("car_rental_package_prices.deleted_at")
        .modify((qb) => {
          if (typeof status !== "undefined") {
            qb.where("car_rental_reservations.status", status);
          }
          if (car_rental_id) {
            qb.where("car_rental_reservations.car_rental_id", car_rental_id);
          }
          if (start_date) {
            qb.where("car_rental_reservations.start_date", ">=", start_date);
          }
          if (end_date) {
            qb.where("car_rental_reservations.end_date", "<=", end_date);
          }
          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("car_rental_pivots.name", "ilike", like)
                .orWhere("car_rental_reservations.progress_id", "ilike", like)
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
        .count<{ total: string }>("car_rental_reservations.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Data selection
      const data = await base
        .clone()
        .select(
          "car_rental_reservations.id",
          "car_rental_reservations.car_rental_id",
          "car_rental_reservations.package_id",
          "car_rental_reservations.created_by",
          "car_rental_reservations.sales_partner_id",
          "car_rental_reservations.progress_id",
          "car_rental_reservations.price",
          "car_rental_reservations.currency_code",
          "car_rental_reservations.payment_id",
          "car_rental_reservations.different_invoice",
          "car_rental_reservations.status",
          "car_rental_reservations.start_date",
          "car_rental_reservations.end_date",
          "car_rental_reservations.created_at",
          "car_rental_reservations.updated_at",
          "car_rental_pivots.title as car_rental_name",
          "car_rental_package_prices.main_price",
          "car_rental_package_prices.child_price",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone",
          "city_pivots.name as city_name",
          "country_pivots.name as country_name",
          // Get the first car rental image
          knex.raw(`(
            SELECT image_url
            FROM car_rental_galleries
            WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
            AND car_rental_galleries.deleted_at IS NULL
            ORDER BY car_rental_galleries.created_at ASC
            LIMIT 1
          ) as car_rental_image`)
        )
        .orderBy("car_rental_reservations.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
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
        message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }

  async getReservationById(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language || "en";
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      // Validate that the ID is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).send({
          success: false,
          message: "Invalid reservation ID format. Expected UUID format.",
        });
      }

      const reservation = await knex("car_rental_reservations")
        .whereNull("car_rental_reservations.deleted_at")
        .where("car_rental_reservations.id", id)
        .where("car_rental_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
        .innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
        .innerJoin("car_rental_packages", "car_rental_reservations.package_id", "car_rental_packages.id")
        .innerJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
        .innerJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
        .leftJoin("users", "car_rental_reservations.created_by", "users.id")
        .leftJoin("cities", "car_rentals.location_id", "cities.id")
        .leftJoin("city_pivots", function () {
          this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
        })
        .leftJoin("countries", "cities.country_id", "countries.id")
        .leftJoin("country_pivots", function () {
          this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
        })
        .where("car_rental_pivots.language_code", language)
        .whereNull("car_rentals.deleted_at")
        .whereNull("car_rental_pivots.deleted_at")
        .whereNull("car_rental_packages.deleted_at")
        .whereNull("car_rental_package_prices.deleted_at")
        .select(
          "car_rental_reservations.*",
          "car_rental_pivots.title as car_rental_name",
          "car_rental_package_prices.main_price",
          "car_rental_package_prices.child_price",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone",
          "city_pivots.name as city_name",
          "country_pivots.name as country_name",
          // Get the first car rental image
          knex.raw(`(
            SELECT image_url
            FROM car_rental_galleries
            WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
            AND car_rental_galleries.deleted_at IS NULL
            ORDER BY car_rental_galleries.created_at ASC
            LIMIT 1
          ) as car_rental_image`)
        )
        .first();

      if (!reservation) {
        return res.status(404).send({
          success: false,
          message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      // Get reservation users
      const reservationUsers = await knex("car_rental_reservation_users")
        .where("car_rental_reservation_users.car_rental_reservation_id", id)
        .whereNull("car_rental_reservation_users.deleted_at")
        .select("*");

      reservation.users = reservationUsers;

      return res.status(200).send({
        success: true,
        message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }



  async previewSalesPartnerReservation(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language || "en";
      const salesPartnerUser = (req as any).user;
      const salesPartnerId = salesPartnerUser?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: req.t("AUTH.UNAUTHORIZED"),
        });
      }

      const reservationModel = new CarRentalReservationModel();
      let reservation;

      // Check if the ID is a charge ID (starts with "chg_") or a UUID
      if (id.startsWith("chg_")) {
        // If it's a charge ID, get reservation by payment_id
        reservation = await knex("car_rental_reservations")
          .whereNull("car_rental_reservations.deleted_at")
          .where("car_rental_reservations.payment_id", id)
          .where("car_rental_reservations.sales_partner_id", salesPartnerId)
          .innerJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
          .innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
          .innerJoin("car_rental_packages", "car_rental_reservations.package_id", "car_rental_packages.id")
          .innerJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
          .innerJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
          .leftJoin("users", "car_rental_reservations.created_by", "users.id")
          .leftJoin("cities", "car_rentals.location_id", "cities.id")
          .leftJoin("city_pivots", function () {
            this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .leftJoin("countries", "cities.country_id", "countries.id")
          .leftJoin("country_pivots", function () {
            this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]));
          })
          .where("car_rental_pivots.language_code", language)
          .whereNull("car_rentals.deleted_at")
          .whereNull("car_rental_pivots.deleted_at")
          .whereNull("car_rental_packages.deleted_at")
          .whereNull("car_rental_package_prices.deleted_at")
          .select(
            "car_rental_reservations.*",
            "car_rental_pivots.title as car_rental_name",
            "car_rental_package_prices.main_price",
            "car_rental_package_prices.child_price",
            "currencies.code as currency_code",
            "currencies.symbol as currency_symbol",
            "users.name_surname as user_name",
            "users.email as user_email",
            "users.phone as user_phone",
            "city_pivots.name as city_name",
            "country_pivots.name as country_name",
            // Get the first car rental image
            knex.raw(`(
              SELECT image_url
              FROM car_rental_galleries
              WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
              AND car_rental_galleries.deleted_at IS NULL
              ORDER BY car_rental_galleries.created_at ASC
              LIMIT 1
            ) as car_rental_image`)
          )
          .first();
      } else {
        // If it's a UUID, use the existing method
        reservation = await reservationModel.getUserReservationById(id, language);
      }

      if (!reservation) {
        return res.status(404).send({
          success: false,
          message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_PREVIEW_SUCCESS"),
        data: reservation,
      });

    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_RENTAL_RESERVATION.RESERVATION_PREVIEW_ERROR"),
      });
    }
  }
}
