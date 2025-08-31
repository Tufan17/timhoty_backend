import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourGalleryModel from "@/models/TourGalleryModel";
import TourModel from "@/models/TourModel";
import { translateCreate } from "@/helper/translate";

export default class TourGalleryController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        tour_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        tour_id?: string;
      };

      const language = req.language || "en";

      // Base query
      const base = knex("tour_galleries")
        .whereNull("tour_galleries.deleted_at")
        .innerJoin(
          "tours",
          "tour_galleries.tour_id",
          "visas.id"
        )
        .leftJoin(
          "tour_gallery_pivot",
          "tour_galleries.id",
          "tour_gallery_pivot.tour_gallery_id"
        )
        .where("tour_gallery_pivot.language_code", language)
        .whereNull("tours.deleted_at")
        .whereNull("visa_gallery_pivot.deleted_at")
        .modify((qb) => {
          if (tour_id) {
            qb.where("tour_galleries.tour_id", tour_id);
          }

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
                    w.where("tour_galleries.image_type", "ilike", like)
                .orWhere("tour_gallery_pivot.category", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>(
          "tour_galleries.id as total"
        )
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("tour_galleries.id")
        .select(
          "tour_galleries.*",
          "tour_gallery_pivot.category"
        )
        .orderBy("tour_galleries.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.FETCHED_SUCCESS"),
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
          message: req.t("TOUR_GALLERY.FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tour_id } = req.query as { tour_id?: string };
      const language = req.language || "en";

      let query = knex("tour_galleries")
        .whereNull("tour_galleries.deleted_at")
        .leftJoin(
            "tour_gallery_pivot",
          "tour_galleries.id",
          "tour_gallery_pivot.tour_gallery_id"
        )
        .where("tour_gallery_pivot.language_code", language)
        .whereNull("tour_gallery_pivot.deleted_at")
        .select(
          "tour_galleries.*",
          "tour_gallery_pivot.category"
        );

      if (tour_id) {
        query = query.where(
            "tour_galleries.tour_id",
          tour_id
        );
      }

      const images = await query.orderBy("tour_galleries.created_at", "desc");

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.FETCHED_SUCCESS"),
        data: images,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_GALLERY.FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = req.language || "en";

        const image = await knex("tour_galleries")
        .whereNull("tour_galleries.deleted_at")
        .leftJoin(
          "tour_gallery_pivot",
          "tour_galleries.id",
          "tour_gallery_pivot.tour_gallery_id"
        )
        .where("tour_gallery_pivot.language_code", language)
        .whereNull("tour_gallery_pivot.deleted_at")
        .where("visa_galleries.id", id)
        .select(
          "tour_galleries.*",
          "tour_gallery_pivot.category"
        )
        .first();

      if (!image) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_GALLERY.NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.FETCHED_SUCCESS"),
        data: image,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
          message: req.t("TOUR_GALLERY.FETCHED_ERROR"),
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

      // Validate hotel_id
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

      // Create hotel room images
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
          .where({ visa_gallery_id: id })
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
      const existingImage = await new TourGalleryModel().exists({ id });

      if (!existingImage) {
        return res.status(404).send({
          success: false,
            message: req.t("TOUR_GALLERY.NOT_FOUND"),
        });
      }

      await knex.transaction(async (trx) => {
        // Soft delete main record
        await trx("tour_galleries")
          .where({ id })
          .update({ deleted_at: new Date() });

        // Soft delete translations
        await trx("tour_gallery_pivot")
          .where({ visa_gallery_id: id })
          .update({ deleted_at: new Date() });
      });

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_GALLERY.DELETED_ERROR"),
      });
    }
  }

  async bulkDelete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { ids } = req.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_GALLERY.NO_IDS_PROVIDED"),
        });
      }

      // Check if all images exist
      const existingImages = await knex("tour_galleries")
        .whereIn("id", ids)
        .whereNull("deleted_at");

      if (existingImages.length !== ids.length) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_GALLERY.SOME_NOT_FOUND"),
        });
      }

      // Delete all images and their translations
      await knex.transaction(async (trx) => {
        // Soft delete main records
            await trx("tour_galleries")
          .whereIn("id", ids)
          .update({ deleted_at: new Date() });

        // Soft delete translations
        await trx("tour_gallery_pivot")
          .whereIn("visa_gallery_id", ids)
          .update({ deleted_at: new Date() });
      });

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_GALLERY.BULK_DELETED_SUCCESS"),
        data: { deletedCount: ids.length },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_GALLERY.BULK_DELETED_ERROR"),
      });
    }
  }
}
