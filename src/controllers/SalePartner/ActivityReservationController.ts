import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import ActivityReservationModel from "@/models/ActivityReservationModel";

export default class ActivityReservationController {
  async getSalesPartnerReservations(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        activity_id,
        period,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        status?: boolean;
        activity_id?: string;
        period?: string;
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
      const base = knex("activity_reservations")
        .where("activity_reservations.status", true)
        .whereNull("activity_reservations.deleted_at")
        .where("activity_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("activities", "activity_reservations.activity_id", "activities.id")
        .innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
        .innerJoin("cities", "activities.location_id", "cities.id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .innerJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
        .leftJoin("users", "activity_reservations.created_by", "users.id")
        .leftJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
        .leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
        .leftJoin("currencies", "activity_reservations.currency_code", "currencies.code")
        .where("activity_package_pivots.language_code", language)
        .where("activity_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .whereNull("activities.deleted_at")
        .whereNull("activity_pivots.deleted_at")
        .whereNull("cities.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("activity_packages.deleted_at")
        .modify((qb) => {
          if (typeof status !== "undefined") {
            qb.where("activity_reservations.status", status);
          }
          if (activity_id) {
            qb.where("activity_reservations.activity_id", activity_id);
          }
          // Period filter removed - column does not exist in activity_reservations table
          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("activity_pivots.title", "ilike", like)
                .orWhere("activity_reservations.progress_id", "ilike", like)
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
        .count<{ total: string }>("activity_reservations.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Data selection
      const data = await base
        .clone()
        .select(
          "activity_reservations.id",
          "activity_reservations.activity_id",
          "activity_reservations.package_id",
          "activity_reservations.created_by",
          "activity_reservations.sales_partner_id",
          "activity_reservations.progress_id",
          "activity_reservations.price",
          "activity_reservations.currency_code",
          "activity_reservations.payment_id",
          "activity_reservations.different_invoice",
          "activity_reservations.status",
          "activity_reservations.date",
          "activity_reservations.activity_package_hour_id",
          "activity_reservations.created_at",
          "activity_reservations.updated_at",
          "activity_pivots.title as activity_name",
          "activity_package_pivots.name as package_name",
          "city_pivots.name as city_name",
          "activity_package_hours.hour as activity_hour",
          "activity_package_hours.minute as activity_minute",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone",
        )
        .orderBy("activity_reservations.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("ACTIVITY_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
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
        message: req.t("ACTIVITY_RESERVATION.RESERVATION_FETCHED_ERROR"),
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

      const reservation = await knex("activity_reservations")
        .whereNull("activity_reservations.deleted_at")
        .where("activity_reservations.id", id)
        .where("activity_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("activities", "activity_reservations.activity_id", "activities.id")
        .innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
        .innerJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
        .leftJoin("users", "activity_reservations.created_by", "users.id")
        .leftJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
        .leftJoin("currencies", "activity_reservations.currency_code", "currencies.code")
        .where("activity_pivots.language_code", language)
        .where("activity_package_pivots.language_code", language)
        .whereNull("activities.deleted_at")
        .whereNull("activity_pivots.deleted_at")
        .whereNull("activity_packages.deleted_at")
        .select(
          "activity_reservations.*",
          "activity_pivots.title as activity_name",
          "activity_package_pivots.name as package_name",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone"
        )
        .first();

      if (!reservation) {
        return res.status(404).send({
          success: false,
          message: req.t("ACTIVITY_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      // Get reservation users
      const reservationUsers = await knex("activity_reservation_users")
        .where("activity_reservation_users.activity_reservation_id", id)
        .whereNull("activity_reservation_users.deleted_at")
        .select("*");

      reservation.users = reservationUsers;

      return res.status(200).send({
        success: true,
        message: req.t("ACTIVITY_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ACTIVITY_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }

  async previewSalesPartnerReservation(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language as string;

      const reservationModel = new ActivityReservationModel();

      const reservation = await reservationModel.getUserReservationById(id, language);

      return res.status(200).send({
        success: true,
        message: req.t("ACTIVITY_RESERVATION.RESERVATION_PREVIEW_SUCCESS"),
        data: reservation,
      });

    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("ACTIVITY_RESERVATION.RESERVATION_PREVIEW_ERROR"),
      });
    }
  }
}
