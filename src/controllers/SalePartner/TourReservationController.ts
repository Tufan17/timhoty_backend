import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import TourReservationModel from "@/models/TourReservationModel";

export default class TourReservationController {
  async getSalesPartnerReservations(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        tour_id,
        period,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        status?: boolean;
        tour_id?: string;
        period?: string;
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
      const base = knex("tour_reservations")
        .where("tour_reservations.status", true)
        .whereNull("tour_reservations.deleted_at")
        .where("tour_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("tours", "tour_reservations.tour_id", "tours.id")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .innerJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
        .innerJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
        .innerJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
        .leftJoin("users", "tour_reservations.created_by", "users.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tours.deleted_at")
        .whereNull("tour_pivots.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .whereNull("tour_package_prices.deleted_at")
        .modify((qb) => {
          if (typeof status !== "undefined") {
            qb.where("tour_reservations.status", status);
          }
          if (tour_id) {
            qb.where("tour_reservations.tour_id", tour_id);
          }
          if (period) {
            qb.where("tour_reservations.period", period);
          }
          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_pivots.title", "ilike", like)
                .orWhere("tour_reservations.progress_id", "ilike", like)
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
        .count<{ total: string }>("tour_reservations.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Data selection
      const data = await base
        .clone()
        .select(
          "tour_reservations.id",
          "tour_reservations.tour_id",
          "tour_reservations.package_id",
          "tour_reservations.created_by",
          "tour_reservations.sales_partner_id",
          "tour_reservations.progress_id",
          "tour_reservations.price",
          "tour_reservations.currency_code",
          "tour_reservations.payment_id",
          "tour_reservations.different_invoice",
          "tour_reservations.status",
          "tour_reservations.period",
          "tour_reservations.created_at",
          "tour_reservations.updated_at",
          "tour_pivots.title as tour_name",
          "tour_package_prices.main_price",
          "tour_package_prices.child_price",
          "tour_package_prices.baby_price",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone",
        )
        .orderBy("tour_reservations.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
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
        message: req.t("TOUR_RESERVATION.RESERVATION_FETCHED_ERROR"),
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

      const reservation = await knex("tour_reservations")
        .whereNull("tour_reservations.deleted_at")
        .where("tour_reservations.id", id)
        .where("tour_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("tours", "tour_reservations.tour_id", "tours.id")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .innerJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
        .innerJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
        .innerJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
        .leftJoin("users", "tour_reservations.created_by", "users.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tours.deleted_at")
        .whereNull("tour_pivots.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .whereNull("tour_package_prices.deleted_at")
        .select(
          "tour_reservations.*",
          "tour_pivots.title as tour_name",
          "tour_package_prices.main_price",
          "tour_package_prices.child_price",
          "tour_package_prices.baby_price",
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
          message: req.t("TOUR_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      // Get reservation users
      const reservationUsers = await knex("tour_reservation_users")
        .where("tour_reservation_users.tour_reservation_id", id)
        .whereNull("tour_reservation_users.deleted_at")
        .select("*");

      reservation.users = reservationUsers;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }



  async previewSalesPartnerReservation(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language as string;

      const reservationModel = new TourReservationModel();

      const reservation = await reservationModel.getUserReservationById(id, language);

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_RESERVATION.RESERVATION_PREVIEW_SUCCESS"),
        data: reservation,
      });


    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_RESERVATION.RESERVATION_PREVIEW_ERROR"),
      });
    }
  }
}
