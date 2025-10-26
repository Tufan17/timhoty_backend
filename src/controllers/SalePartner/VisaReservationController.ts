import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import VisaReservationModel from "@/models/VisaReservationModel";

export default class VisaReservationController {
  async getSalesPartnerReservations(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        visa_id,
        start_date,
        end_date,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        status?: boolean;
        visa_id?: string;
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
      const base = knex("visa_reservations")
        .where("visa_reservations.status", true)
        .whereNull("visa_reservations.deleted_at")
        .where("visa_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("visas", "visa_reservations.visa_id", "visas.id")
        .innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
        .innerJoin(
          "visa_packages",
          "visa_reservations.package_id",
          "visa_packages.id"
        )
        .innerJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .innerJoin(
          "currencies",
          "visa_package_prices.currency_id",
          "currencies.id"
        )
        .leftJoin("users", "visa_reservations.created_by", "users.id")
        .leftJoin("countries", "visas.location_id", "countries.id")
        .leftJoin("country_pivots", function () {
          this.on("countries.id", "=", "country_pivots.country_id").andOn(
            "country_pivots.language_code",
            "=",
            knex.raw("?", [language])
          );
        })
        .where("visa_pivots.language_code", language)
        .whereNull("visas.deleted_at")
        .whereNull("visa_pivots.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .whereNull("visa_package_prices.deleted_at")
        .modify((qb) => {
          if (typeof status !== "undefined") {
            qb.where("visa_reservations.status", status);
          }
          if (visa_id) {
            qb.where("visa_reservations.visa_id", visa_id);
          }
          if (start_date) {
            qb.where("visa_reservations.date", ">=", start_date);
          }
          if (end_date) {
            qb.where("visa_reservations.date", "<=", end_date);
          }
          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("visa_pivots.title", "ilike", like)
                .orWhere("visa_reservations.progress_id", "ilike", like)
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
        .count<{ total: string }>("visa_reservations.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Data selection
      const data = await base
        .clone()
        .select(
          "visa_reservations.id",
          "visa_reservations.visa_id",
          "visa_reservations.package_id",
          "visa_reservations.created_by",
          "visa_reservations.sales_partner_id",
          "visa_reservations.progress_id",
          "visa_reservations.price",
          "visa_reservations.currency_code",
          "visa_reservations.payment_id",
          "visa_reservations.different_invoice",
          "visa_reservations.status",
          "visa_reservations.date",
          "visa_reservations.created_at",
          "visa_reservations.updated_at",
          "visa_pivots.title as visa_title",
          "visa_package_prices.main_price",
          "visa_package_prices.child_price",
          "currencies.code as currency_code",
          "currencies.symbol as currency_symbol",
          "users.name_surname as user_name",
          "users.email as user_email",
          "users.phone as user_phone",
          "country_pivots.name as country_name"
        )
        .orderBy("visa_reservations.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("VISA_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
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
        message: req.t("VISA_RESERVATION.RESERVATION_FETCHED_ERROR"),
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

      const reservation = await knex("visa_reservations")
        .whereNull("visa_reservations.deleted_at")
        .where("visa_reservations.id", id)
        .where("visa_reservations.sales_partner_id", salesPartnerId)
        .innerJoin("visas", "visa_reservations.visa_id", "visas.id")
        .innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
        .innerJoin(
          "visa_packages",
          "visa_reservations.package_id",
          "visa_packages.id"
        )
        .innerJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .innerJoin(
          "currencies",
          "visa_package_prices.currency_id",
          "currencies.id"
        )
        .leftJoin("users", "visa_reservations.created_by", "users.id")
        .where("visa_pivots.language_code", language)
        .whereNull("visas.deleted_at")
        .whereNull("visa_pivots.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .whereNull("visa_package_prices.deleted_at")
        .select(
          "visa_reservations.*",
          "visa_pivots.title as visa_title",
          "visa_package_prices.main_price",
          "visa_package_prices.child_price",
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
          message: req.t("VISA_RESERVATION.RESERVATION_NOT_FOUND"),
        });
      }

      // Get reservation users
      const reservationUsers = await knex("visa_reservation_users")
        .where("visa_reservation_users.visa_reservation_id", id)
        .whereNull("visa_reservation_users.deleted_at")
        .select("*");

      // Get reservation user files
      const userFiles = await knex("visa_reservation_user_files")
        .where("visa_reservation_user_files.visa_reservation_id", id)
        .whereNull("visa_reservation_user_files.deleted_at")
        .select("*");

      // Get visa main image
      const visaImage = await knex("visa_galleries")
        .select("visa_galleries.image_url")
        .innerJoin("visa_gallery_pivot", "visa_galleries.id", "visa_gallery_pivot.visa_gallery_id")
        .where("visa_galleries.visa_id", reservation.visa_id)
        .whereNull("visa_galleries.deleted_at")
        .whereNull("visa_gallery_pivot.deleted_at")
        .where("visa_gallery_pivot.language_code", language)
        .where("visa_gallery_pivot.category", "Kapak Resmi")
        .whereRaw(
          `visa_galleries.id IN (
            SELECT vg.id FROM visa_galleries vg
            LEFT JOIN visa_gallery_pivot vgp ON vg.id = vgp.visa_gallery_id
            WHERE vg.visa_id = ?
            AND vg.deleted_at IS NULL
            AND vgp.deleted_at IS NULL
            AND vgp.language_code = ?
            AND vgp.category = 'Kapak Resmi'
            ORDER BY vg.created_at ASC
            LIMIT 1
          )`,
          [reservation.visa_id, language]
        )
        .first();

      reservation.users = reservationUsers;
      reservation.files = userFiles;
      reservation.visa_image = visaImage?.image_url || null;

      return res.status(200).send({
        success: true,
        message: req.t("VISA_RESERVATION.RESERVATION_FETCHED_SUCCESS"),
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_RESERVATION.RESERVATION_FETCHED_ERROR"),
      });
    }
  }

  async previewSalesPartnerReservation(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language as string;

      const reservationModel = new VisaReservationModel();

      const reservation = await reservationModel.getSalesPartnerReservationById(
        id,
        language
      );

      const userFiles = await knex("visa_reservation_user_files")
        .where("visa_reservation_user_files.visa_reservation_id", id)
        .whereNull("visa_reservation_user_files.deleted_at")
        .select("*");

      // Get visa main image
      const visaImage = await knex("visa_galleries")
        .select("visa_galleries.image_url")
        .innerJoin("visa_gallery_pivot", "visa_galleries.id", "visa_gallery_pivot.visa_gallery_id")
        .where("visa_galleries.visa_id", reservation.visa_id)
        .whereNull("visa_galleries.deleted_at")
        .whereNull("visa_gallery_pivot.deleted_at")
        .where("visa_gallery_pivot.language_code", language)
        .where("visa_gallery_pivot.category", "Kapak Resmi")
        .whereRaw(
          `visa_galleries.id IN (
            SELECT vg.id FROM visa_galleries vg
            LEFT JOIN visa_gallery_pivot vgp ON vg.id = vgp.visa_gallery_id
            WHERE vg.visa_id = ?
            AND vg.deleted_at IS NULL
            AND vgp.deleted_at IS NULL
            AND vgp.language_code = ?
            AND vgp.category = 'Kapak Resmi'
            ORDER BY vg.created_at ASC
            LIMIT 1
          )`,
          [reservation.visa_id, language]
        )
        .first();

      reservation.files = userFiles;
      reservation.visa_image = visaImage?.image_url || null;

      return res.status(200).send({
        success: true,
        message: req.t("VISA_RESERVATION.RESERVATION_PREVIEW_SUCCESS"),
        data: reservation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_RESERVATION.RESERVATION_PREVIEW_ERROR"),
      });
    }
  }
}
