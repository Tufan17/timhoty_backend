import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import TourModel from "@/models/TourModel";
import TourPivotModel from "@/models/TourPivotModel";

export default class TourController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        solution_partner_id,
        status,
        admin_approval,
        highlight,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        solution_partner_id?: string;
        status?: boolean;
        admin_approval?: boolean;
        highlight?: boolean;
      };

      const language = (req as any).language;

      // Base query with JOINs
      const base = knex("tours")
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .modify((qb) => {
          if (solution_partner_id) {
            qb.where("tours.solution_partner_id", solution_partner_id);
          }
          if (typeof status !== "undefined") qb.where("tours.status", status);
          if (typeof admin_approval !== "undefined")
            qb.where("tours.admin_approval", admin_approval);
          if (typeof highlight !== "undefined")
            qb.where("tours.highlight", highlight);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_pivots.title", "ilike", like)
                .orWhere("tour_pivots.general_info", "ilike", like)
                .orWhere("tour_pivots.tour_info", "ilike", like)
                .orWhere("tour_pivots.refund_policy", "ilike", like)
                .orWhere("solution_partners.company_name", "ilike", like);
            }); 

            // Handle "true"/"false" text for status filter
            const sv = search.toLowerCase();
            if (sv === "true" || sv === "false") {
              qb.orWhere("tours.status", sv === "true");
            }
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
          "tours.*",
          "tour_pivots.title",
          "tour_pivots.general_info",
          "tour_pivots.tour_info",
          "tour_pivots.refund_policy",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
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
      console.error("Admin Tour dataTable error:", error);
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
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .select([
          "tours.*",
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
      console.error("Admin Tour findOne error:", error);
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
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .select([
          "tours.id",
          "tours.status",
          "tours.highlight",
          "tours.admin_approval",
          "tours.night_count",
          "tours.day_count",
          "tour_pivots.title",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
        .orderBy("tours.created_at", "desc");

      return res.send({
        success: true,
        message: "Turlar başarıyla getirildi",
        data: tours,
      });
    } catch (error) {
      console.error("Admin Tour findAll error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const updateData = req.body as any;

      // Check if tour exists
      const existingTour = await knex("tours")
        .where("id", id)
        .whereNull("deleted_at")
        .first();

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      // Extract pivot data
      const {
        title,
        general_info,
        tour_info,
        refund_policy,
        language_code = "en",
        ...tourFields
      } = updateData;

      // Update tour
      if (Object.keys(tourFields).length > 0) {
        await knex("tours")
          .where("id", id)
          .update({
            ...tourFields,
            updated_at: new Date(),
          });
      }

      // Update or create tour pivot
      if (title || general_info || tour_info || refund_policy) {
        const existingPivot = await knex("tour_pivots")
          .where("tour_id", id)
          .where("language_code", language_code)
          .whereNull("deleted_at")
          .first();

        if (existingPivot) {
          await knex("tour_pivots")
            .where("id", existingPivot.id)
            .update({
              title: title || existingPivot.title,
              general_info: general_info || existingPivot.general_info,
              tour_info: tour_info || existingPivot.tour_info,
              refund_policy: refund_policy || existingPivot.refund_policy,
              updated_at: new Date(),
            });
        } else {
          await knex("tour_pivots").insert({
            tour_id: id,
            title,
            general_info,
            tour_info,
            refund_policy,
            language_code,
          });
        }
      }

      // Get updated tour
      const updatedTour = await knex("tours")
        .where("tours.id", id)
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .leftJoin("solution_partners", "tours.solution_partner_id", "solution_partners.id")
        .where("tour_pivots.language_code", language_code)
        .whereNull("tour_pivots.deleted_at")
        .whereNull("solution_partners.deleted_at")
        .select([
          "tours.*",
          "tour_pivots.title",
          "tour_pivots.general_info",
          "tour_pivots.tour_info",
          "tour_pivots.refund_policy",
          "tour_pivots.language_code",
          "solution_partners.company_name as solution_partner_name"
        ])
        .first();

      return res.send({
        success: true,
        message: "Tur başarıyla güncellendi",
        data: updatedTour,
      });
    } catch (error) {
      console.error("Admin Tour update error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      // Check if tour exists
      const existingTour = await knex("tours")
        .where("id", id)
        .whereNull("deleted_at")
        .first();

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      // Soft delete tour and related pivots
      await knex("tours")
        .where("id", id)
        .update({ deleted_at: new Date() });

      await knex("tour_pivots")
        .where("tour_id", id)
        .update({ deleted_at: new Date() });

      return res.send({
        success: true,
        message: "Tur başarıyla silindi",
        data: null,
      });
    } catch (error) {
      console.error("Admin Tour delete error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async approve(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      // Check if tour exists
      const existingTour = await knex("tours")
        .where("id", id)
        .whereNull("deleted_at")
        .first();

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      // Update admin approval status
      await knex("tours")
        .where("id", id)
        .update({
          admin_approval: true,
          updated_at: new Date(),
        });

      return res.send({
        success: true,
        message: "Tur başarıyla onaylandı",
        data: null,
      });
    } catch (error) {
      console.error("Admin Tour approve error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async reject(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      // Check if tour exists
      const existingTour = await knex("tours")
        .where("id", id)
        .whereNull("deleted_at")
        .first();

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      // Update admin approval status
      await knex("tours")
        .where("id", id)
        .update({
          admin_approval: false,
          updated_at: new Date(),
        });

      return res.send({
        success: true,
        message: "Tur başarıyla reddedildi",
        data: null,
      });
    } catch (error) {
      console.error("Admin Tour reject error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }
}
