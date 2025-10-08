import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import HotelGalleryModel from "@/models/HotelGalleryModel";
import HotelGalleryPivotModel from "@/models/HotelGalleryPivotModel";
import HotelModel from "@/models/HotelModel";
import { translateCreate } from "@/helper/translate";

export default class HotelGalleryController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        hotel_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        hotel_id?: string;
      };

      const language = req.language || "en";

      // Base query
      const base = knex("hotel_galleries")
        .whereNull("hotel_galleries.deleted_at")
        .innerJoin("hotels", "hotel_galleries.hotel_id", "hotels.id")
        .leftJoin(
          "hotel_gallery_pivot",
          "hotel_galleries.id",
          "hotel_gallery_pivot.hotel_gallery_id"
        )
        .where("hotel_gallery_pivot.language_code", language)
        .whereNull("hotels.deleted_at")
        .whereNull("hotel_gallery_pivot.deleted_at")
        .modify((qb) => {
          if (hotel_id) {
            qb.where("hotel_galleries.hotel_id", hotel_id);
          }

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_galleries.image_type", "ilike", like).orWhere(
                "hotel_gallery_pivot.category",
                "ilike",
                like
              );
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("hotel_galleries.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("hotel_galleries.id")
        .select("hotel_galleries.*", "hotel_gallery_pivot.category")
        .orderBy("hotel_galleries.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.FETCHED_SUCCESS"),
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
        message: req.t("HOTEL_GALLERY.FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { hotel_id } = req.query as { hotel_id?: string };
      const language = req.language || "en";

      let query = knex("hotel_galleries")
        .whereNull("hotel_galleries.deleted_at")
        .leftJoin(
          "hotel_gallery_pivot",
          "hotel_galleries.id",
          "hotel_gallery_pivot.hotel_gallery_id"
        )
        .where("hotel_gallery_pivot.language_code", language)
        .whereNull("hotel_gallery_pivot.deleted_at")
        .select("hotel_galleries.*", "hotel_gallery_pivot.category");

      if (hotel_id) {
        query = query.where("hotel_galleries.hotel_id", hotel_id);
      }

      const images = await query.orderBy("hotel_galleries.created_at", "desc");

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.FETCHED_SUCCESS"),
        data: images,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_GALLERY.FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = req.language || "en";

      const image = await knex("hotel_galleries")
        .whereNull("hotel_galleries.deleted_at")
        .leftJoin(
          "hotel_gallery_pivot",
          "hotel_galleries.id",
          "hotel_gallery_pivot.hotel_gallery_id"
        )
        .where("hotel_gallery_pivot.language_code", language)
        .whereNull("hotel_gallery_pivot.deleted_at")
        .where("hotel_galleries.id", id)
        .select("hotel_galleries.*", "hotel_gallery_pivot.category")
        .first();

      if (!image) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_GALLERY.NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.FETCHED_SUCCESS"),
        data: image,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_GALLERY.FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { hotel_id, category, images } = req.body as {
        hotel_id: string;
        category: string;
        images: string | string[];
      };

      // Validate hotel_id
      const existingHotel = await new HotelModel().exists({
        id: hotel_id,
      });

      if (!existingHotel) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL.NOT_FOUND"),
        });
      }

      const existingHotelGallery = await new HotelGalleryModel().hasCoverImage(
        hotel_id
      );

      if (existingHotelGallery) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_GALLERY.CATEGORY_ALREADY_EXISTS"),
        });
      }

      // Normalize images to array
      const imageUrls = Array.isArray(images) ? images : [images];
      const createdImages = [];

      // Create hotel room images
      for (const imageUrl of imageUrls) {
        let image_type = "";

        if (
          imageUrl.includes(".mp4") ||
          imageUrl.includes(".mov") ||
          imageUrl.includes(".webm") ||
          imageUrl.includes(".avi") ||
          imageUrl.includes(".wmv") ||
          imageUrl.includes(".flv") ||
          imageUrl.includes(".mkv")
        ) {
          image_type = "video";
        } else {
          image_type = "image";
        }

        const image = await new HotelGalleryModel().create({
          hotel_id,
          image_type,
          image_url: imageUrl,
        });

        // Create translations
        await translateCreate({
          target: "hotel_gallery_pivot",
          target_id: image.id,
          target_id_key: "hotel_gallery_id",
          data: {
            category,
          },
          language_code: req.language,
        });
        createdImages.push(image);
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.CREATED_SUCCESS"),
        data: createdImages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_GALLERY.CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { hotel_id, image_type, category } = req.body as {
        hotel_id?: string;
        image_type?: string;
        category?: string;
      };

      // Check if anything to update
      if (!hotel_id && !image_type && !category) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_GALLERY.NO_UPDATE_DATA"),
        });
      }

      // Check image existence
      const existingImage = await new HotelGalleryModel().exists({ id });

      if (!existingImage) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_GALLERY.NOT_FOUND"),
        });
      }

      // Validate hotel if hotel_id is provided
      if (hotel_id) {
        const hotel = await new HotelModel().exists({
          id: hotel_id,
        });

        if (!hotel) {
          return res.status(400).send({
            success: false,
            message: req.t("HOTEL.NOT_FOUND"),
          });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (hotel_id) updateData.hotel_id = hotel_id;
      if (image_type) updateData.image_type = image_type;
      // if (category) updateData.category = category

      // Update image
      const updatedImage = await new HotelGalleryModel().update(id, updateData);

      // Update translations if provided
      if (category) {
        await knex("hotel_gallery_pivot")
          .where({ hotel_gallery_id: id })
          .update({ deleted_at: new Date() });

        const newTranslations = await translateCreate({
          target: "hotel_gallery_pivot",
          target_id: id,
          target_id_key: "hotel_gallery_id",
          data: {
            category,
          },
          language_code: req.language,
        });

        updatedImage.translations = newTranslations;
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.UPDATED_SUCCESS"),
        data: updatedImage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_GALLERY.UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingImage = await new HotelGalleryModel().exists({ id });

      if (!existingImage) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_GALLERY.NOT_FOUND"),
        });
      }

      await knex.transaction(async (trx) => {
        // Soft delete main record
        await trx("hotel_galleries")
          .where({ id })
          .update({ deleted_at: new Date() });

        // Soft delete translations
        await trx("hotel_gallery_pivot")
          .where({ hotel_gallery_id: id })
          .update({ deleted_at: new Date() });
      });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_GALLERY.DELETED_ERROR"),
      });
    }
  }

  async bulkDelete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { ids } = req.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_GALLERY.NO_IDS_PROVIDED"),
        });
      }

      // Check if all images exist
      const existingImages = await knex("hotel_galleries")
        .whereIn("id", ids)
        .whereNull("deleted_at");

      if (existingImages.length !== ids.length) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_GALLERY.SOME_NOT_FOUND"),
        });
      }

      // Delete all images and their translations
      await knex.transaction(async (trx) => {
        // Soft delete main records
        await trx("hotel_galleries")
          .whereIn("id", ids)
          .update({ deleted_at: new Date() });

        // Soft delete translations
        await trx("hotel_gallery_pivot")
          .whereIn("hotel_gallery_id", ids)
          .update({ deleted_at: new Date() });
      });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_GALLERY.BULK_DELETED_SUCCESS"),
        data: { deletedCount: ids.length },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_GALLERY.BULK_DELETED_ERROR"),
      });
    }
  }
}
