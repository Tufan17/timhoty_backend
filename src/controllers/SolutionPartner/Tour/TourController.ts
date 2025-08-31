import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourModel from "@/models/TourModel";
import TourPivotModel from "@/models/TourPivotModel";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

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
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      // Base query with JOINs
      const base = knex("tours")
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .modify((qb) => {
          // solution_partner_id (first from user, then from query)
          if (spFromUser) qb.where("tours.solution_partner_id", spFromUser);
          else if (solution_partner_id)
            qb.where("tours.solution_partner_id", solution_partner_id);

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
                .orWhere("tour_pivots.refund_policy", "ilike", like);
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
          "tour_pivots.language_code"
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
      console.error("Tour dataTable error:", error);
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
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      const tour = await knex("tours")
        .where("tours.id", id)
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .select([
          "tours.*",
          "tour_pivots.title",
          "tour_pivots.general_info",
          "tour_pivots.tour_info",
          "tour_pivots.refund_policy",
          "tour_pivots.language_code"
        ])
        .first();

      if (!tour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      // Check if user has access to this tour
      if (spFromUser && tour.solution_partner_id !== spFromUser) {
        return res.status(403).send({
          success: false,
          message: "Erişim reddedildi",
          data: null,
        });
      }
      const tourGalleries = await knex("tour_galleries")
      .where("tour_galleries.tour_id", id)
      .whereNull("tour_galleries.deleted_at")
      .leftJoin(
        "tour_gallery_pivot",
        "tour_galleries.id",
        "tour_gallery_pivot.tour_gallery_id"
      )
      .where("tour_gallery_pivot.language_code", req.language)
      .whereNull("tour_gallery_pivot.deleted_at")
      .select("tour_galleries.*", "tour_gallery_pivot.category");
    tour.tour_galleries = tourGalleries;
      return res.send({
        success: true,
        message: "Tur başarıyla getirildi",
        data: tour,
      });
    } catch (error) {
      console.error("Tour findOne error:", error);
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
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      const tours = await knex("tours")
        .whereNull("tours.deleted_at")
        .innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
        .where("tour_pivots.language_code", language)
        .whereNull("tour_pivots.deleted_at")
        .modify((qb) => {
          if (spFromUser) {
            qb.where("tours.solution_partner_id", spFromUser);
          }
        })
        .select([
          "tours.id",
          "tours.status",
          "tours.highlight",
          "tours.night_count",
          "tours.day_count",
          "tour_pivots.title",
          "tour_pivots.language_code"
        ])
        .orderBy("tours.created_at", "desc");

      return res.send({
        success: true,
        message: "Turlar başarıyla getirildi",
        data: tours,
      });
    } catch (error) {
      console.error("Tour findAll error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      // Get the authenticated solution partner from the request
      const solutionPartnerUser = (req as any).user;
      const {
        night_count,
        day_count,
        refund_days,
        user_count,
        title,
        general_info,
        tour_info,
        refund_policy,
      } = req.body as {
        night_count: number;
        day_count: number;
        refund_days: number;
        user_count?: number;
        title: string;
        general_info: string;
        tour_info: string;
        refund_policy?: string;
      };

      if (!solutionPartnerUser?.solution_partner_id) {
        return res.status(403).send({
          success: false,
          message: req.t("TOUR.TOUR_ACCESS_DENIED"),
          data: null,
        });
      }

      const tour = await new TourModel().create({
        night_count,
        day_count,
        refund_days,
        user_count,
        solution_partner_id: solutionPartnerUser.solution_partner_id,
      });

      const translateResult = await translateCreate({
        target: "tour_pivots",
        target_id_key: "tour_id",
        target_id: tour.id,
        language_code: req.language,
        data: {
          title,
          general_info,
          tour_info,
          refund_policy,
        },
      });
      tour.tour_pivots = translateResult;

      return res.status(201).send({
        success: true,
        message: req.t("TOUR.TOUR_CREATED_SUCCESS"),
        data: tour,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR.TOUR_CREATED_ERROR"),
        data: null,
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const {
        night_count,
        day_count,
        refund_days,
        user_count,
        title,
        general_info,
        tour_info,
        refund_policy,
      } = req.body as {
        night_count: number;
        day_count: number;
        refund_days: number;
        user_count: number;
        title: string;
        general_info: string;
        tour_info: string;
        refund_policy: string;
      };



      const existingTour = await new TourModel().first({ id });

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR.TOUR_NOT_FOUND"),
          data: null,
        });
      }


   
      // Build update body with only defined fields
      let body: any = {};
      
      if (night_count !== undefined) body.night_count = night_count;
      if (day_count !== undefined) body.day_count = day_count;
      if (refund_days !== undefined) body.refund_days = refund_days;
      if (user_count !== undefined) body.user_count = user_count;

      // Update tour if there are fields to update
      if (Object.keys(body).length > 0) {
        await new TourModel().update(id, body);
      }

      await new TourModel().update(id, body);

      // Update translations if provided
      if (title || general_info || tour_info || refund_policy) {
        await translateUpdate({
          target: "tour_pivots",
          target_id_key: "tour_id",
          target_id: id,
          data: {
            ...(title && { title }),
            ...(general_info && { general_info }),
            ...(tour_info && { tour_info }),
            ...(refund_policy && { refund_policy }),
          },
          language_code: req.language,
        });
      }

      const updatedTour = await new TourModel().oneToMany(id, "tour_pivots", "tour_id");

      return res.send({
        success: true,
        message: req.t("TOUR.TOUR_UPDATED_SUCCESS"),
        data: updatedTour,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR.TOUR_UPDATED_ERROR"),
        data: null,
      });
    }
  }
  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      if (!spFromUser) {
        return res.status(403).send({
          success: false,
          message: req.t("TOUR.TOUR_ACCESS_DENIED"),
          data: null,
        });
      }

      // Check if tour exists and user has access
      const existingTour = await new TourModel().first({ id });

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR.TOUR_NOT_FOUND"),
          data: null,
        });
      }

      if (existingTour.solution_partner_id !== spFromUser) {
        return res.status(403).send({
          success: false,
          message: req.t("TOUR.TOUR_ACCESS_DENIED"),
          data: null,
        });
      }

      // Soft delete tour and related pivots
      await new TourModel().delete(id);

      await new TourPivotModel().deleteByTourId(id);

      return res.send({
        success: true,
        message: req.t("TOUR.TOUR_DELETED_SUCCESS"),
        data: null,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR.TOUR_DELETED_ERROR"),
        data: null,
      });
    }
  }
}
