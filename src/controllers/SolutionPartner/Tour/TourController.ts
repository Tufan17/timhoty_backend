import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourModel from "@/models/TourModel";
import TourPivotModel from "@/models/TourPivotModel";
import HotelModel from "@/models/HotelModel";
import TourGalleryModel from "@/models/TourGalleryModel";
import { translateCreate } from "@/helper/translate";

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
            "tour_gallery_pivots",
            "tour_galleries.id",
            "tour_gallery_pivots.tour_gallery_id"
          )
          .where("tour_gallery_pivots.language_code", (req as any).language)
          .whereNull("tour_gallery_pivots.deleted_at")
          .select("tour_galleries.*", "tour_gallery_pivots.category");
        
        tour.tour_galleries = tourGalleries;


        const tourFeatures = await knex("tour_features")
          .where("tour_features.tour_id", id)
          .whereNull("tour_features.deleted_at")
          .innerJoin("tour_feature_pivots", "tour_features.id", "tour_feature_pivots.tour_feature_id")
          .where("tour_feature_pivots.language_code", (req as any).language)
          .whereNull("tour_feature_pivots.deleted_at")
          .select("tour_features.*", "tour_feature_pivots.name");
        tour.tour_features = tourFeatures;


        const tourPrograms = await knex("tour_programs")
          .where("tour_programs.tour_id", id)
          .whereNull("tour_programs.deleted_at")
          .innerJoin("tour_program_pivots", "tour_programs.id", "tour_program_pivots.tour_program_id")
          .where("tour_program_pivots.language_code", (req as any).language)
          .whereNull("tour_program_pivots.deleted_at")
          .orderBy("tour_programs.order", "asc")
          .select([
            "tour_programs.*",
            "tour_program_pivots.title",
            "tour_program_pivots.content"
          ]);
        tour.tour_programs = tourPrograms;

     

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
      const { tour_id, category, images } = req.body as {
        tour_id: string;
        category: string;
        images: string | string[];
      };

      // Validate tour_id
      const existingTour = await new TourModel().exists({
        id: tour_id,
      });

      if (!existingTour) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR.NOT_FOUND"),
        });
      }

      // Normalize images to array
      const imageUrls = Array.isArray(images) ? images : [images];
      const createdImages = [];

      // Create tour images
      for (const imageUrl of imageUrls) {
        let image_type="";

        if (imageUrl.includes(".mp4") || imageUrl.includes(".mov") || imageUrl.includes(".webm") || imageUrl.includes(".avi") || imageUrl.includes(".wmv") || imageUrl.includes(".flv") || imageUrl.includes(".mkv")) {
          image_type = "video";
        } else {
          image_type = "image";
        }

        const image = await new TourGalleryModel().create({
          tour_id,
          image_type,
          image_url: imageUrl,
        });

        // Create translations
        await translateCreate({
          target: "tour_gallery_pivot",
          target_id: image.id,
          target_id_key: "tour_gallery_id",
          data: {
            category,
          },
          language_code: req.language,
        });
        createdImages.push(image);
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.CREATED_SUCCESS"),
        data: createdImages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_GALLERY.CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { tour_id, image_type, category } = req.body as {
        tour_id?: string;
        image_type?: string;
        category?: string;
      };

      // Check if anything to update
      if (!tour_id && !image_type && !category) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_GALLERY.NO_UPDATE_DATA"),
        });
      }

      // Check image existence
      const existingImage = await new TourGalleryModel().exists({ id });

      if (!existingImage) {
        return res.status(404).send({
          success: false,
            message: req.t("TOUR_GALLERY.NOT_FOUND"),
        });
      }

      // Validate hotel if hotel_id is provided
      if (tour_id) {
        const tour = await new TourModel().exists({
          id: tour_id,
        });

        if (!tour) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR.NOT_FOUND"),
          });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (tour_id) updateData.tour_id = tour_id;
      if (image_type) updateData.image_type = image_type;
      if (category) updateData.category = category;

      // Update image
      const updatedImage = await new TourGalleryModel().update(id, updateData);

      // Update translations if provided
      if (category) {
          await knex("tour_gallery_pivot")
          .where({ tour_gallery_id: id })
          .update({ deleted_at: new Date() });

        const newTranslations = await translateCreate({
          target: "tour_gallery_pivot",
          target_id: id,
          target_id_key: "tour_gallery_id",
          data: {
            category,
          },
          language_code: req.language,
        });

        updatedImage.translations = newTranslations;
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.UPDATED_SUCCESS"),
        data: updatedImage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_GALLERY.UPDATED_ERROR"),
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
          message: "Erişim reddedildi",
          data: null,
        });
      }

      // Check if tour exists and user has access
      const existingTour = await new TourModel().first({ id });

      if (!existingTour) {
        return res.status(404).send({
          success: false,
          message: "Tur bulunamadı",
          data: null,
        });
      }

      if (existingTour.solution_partner_id !== spFromUser) {
        return res.status(403).send({
          success: false,
          message: "Erişim reddedildi",
          data: null,
        });
      }

      // Soft delete tour and related pivots
      await new TourModel().delete(id);

      await new TourPivotModel().deleteByTourId(id);
      

      return res.send({
        success: true,
        message: "Tur başarıyla silindi",
        data: null,
      });
    } catch (error) {
      console.error("Tour delete error:", error);
      return res.status(500).send({
        success: false,
        message: "Sunucu hatası",
        data: null,
      });
    }
  }
}
