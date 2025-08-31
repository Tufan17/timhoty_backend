import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";

export default class TourController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        solution_partner_id,
        status,
        highlight,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        solution_partner_id?: string;
        status?: boolean;
        highlight?: boolean;
      };

      const language = (req as any).language;

      // Base query with JOINs - only show approved and active tours
      const base = knex("tours")
        .whereNull("tours.deleted_at")
        .where("tours.status", true)
        .where("tours.admin_approval", true)
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .modify((qb) => {
          if (solution_partner_id) {
            qb.where("tours.solution_partner_id", solution_partner_id);
          }
          if (typeof highlight !== "undefined") {
            qb.where("tours.highlight", highlight);
          }

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_pivots.title", "ilike", like)
                .orWhere("tour_pivots.general_info", "ilike", like)
                .orWhere("tour_pivots.tour_info", "ilike", like)
                .orWhere("solution_partners.company_name", "ilike", like);
            }); 
          }
        });

      // Total count
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("tours.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data with pagination
      const data = await base
        .select([
          "tours.id",
          "tours.night_count",
          "tours.day_count",
          "tours.refund_days",
          "tours.user_count",
          "tours.comment_count",
          "tours.average_rating",
          "tours.highlight",
          "tour_pivots.title",
          "tour_pivots.general_info",
          "tour_pivots.tour_info",
          "tour_pivots.refund_policy",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
        .orderBy("tours.highlight", "desc")
        .orderBy("tours.average_rating", "desc")
        .orderBy("tours.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.send({
        success: true,
        message: "Turlar başarıyla getirildi",
        data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.error("User Tour dataTable error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const tour = await knex("tours")
        .where("tours.id", id)
        .whereNull("tours.deleted_at")
        .where("tours.status", true)
        .where("tours.admin_approval", true)
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .select([
          "tours.id",
          "tours.night_count",
          "tours.day_count",
          "tours.refund_days",
          "tours.user_count",
          "tours.comment_count",
          "tours.average_rating",
          "tours.highlight",
          "tour_pivots.title",
          "tour_pivots.general_info",
          "tour_pivots.tour_info",
          "tour_pivots.refund_policy",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
        .first();

      if (!tour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      return res.send({
        success: true,
        message: "Tur başarıyla getirildi",
        data: tour,
      });
    } catch (error) {
      console.error("User Tour findOne error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;

      const tours = await knex("tours")
        .whereNull("tours.deleted_at")
        .where("tours.status", true)
        .where("tours.admin_approval", true)
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .select([
          "tours.id",
          "tours.night_count",
          "tours.day_count",
          "tours.highlight",
          "tours.average_rating",
          "tour_pivots.title",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
        .orderBy("tours.highlight", "desc")
        .orderBy("tours.average_rating", "desc")
        .orderBy("tours.created_at", "desc");

      return res.send({
        success: true,
        message: "Turlar başarıyla getirildi",
        data: tours,
      });
    } catch (error) {
      console.error("User Tour findAll error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async featured(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;

      const tours = await knex("tours")
        .whereNull("tours.deleted_at")
        .where("tours.status", true)
        .where("tours.admin_approval", true)
        .where("tours.highlight", true)
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .select([
          "tours.id",
          "tours.night_count",
          "tours.day_count",
          "tours.highlight",
          "tours.average_rating",
          "tour_pivots.title",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
        .orderBy("tours.average_rating", "desc")
        .orderBy("tours.created_at", "desc")
        .limit(6);

      return res.send({
        success: true,
        message: "Öne çıkan turlar başarıyla getirildi",
        data: tours,
      });
    } catch (error) {
      console.error("User Tour featured error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }
}
