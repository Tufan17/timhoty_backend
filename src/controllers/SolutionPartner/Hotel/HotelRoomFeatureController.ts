import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import HotelRoomFeatureModel from "@/models/HotelRoomFeatureModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import HotelRoomModel from "@/models/HotelRoomModel";

export default class HotelRoomFeatureController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        hotel_room_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        hotel_room_id?: string;
      };

      const language = (req as any).language;

      // Base query with JOINs
      const base = knex("hotel_room_features")
        .whereNull("hotel_room_features.deleted_at")
        .innerJoin(
          "hotel_room_feature_pivots",
          "hotel_room_features.id",
          "hotel_room_feature_pivots.hotel_room_feature_id"
        )
        .innerJoin(
          "hotel_rooms",
          "hotel_room_features.hotel_room_id",
          "hotel_rooms.id"
        )
        .where("hotel_room_feature_pivots.language_code", language)
        .whereNull("hotel_room_feature_pivots.deleted_at")
        .whereNull("hotel_rooms.deleted_at")
        .modify((qb) => {
          if (hotel_room_id) {
            qb.where("hotel_room_features.hotel_room_id", hotel_room_id);
          }

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_room_feature_pivots.name", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>(
          "hotel_room_features.id as total"
        )
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("hotel_room_features.id")
        .select(
          "hotel_room_features.*",
          "hotel_room_feature_pivots.name"
        )
        .orderBy("hotel_room_features.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_FEATURE.FETCHED_SUCCESS"),
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
        message: req.t("HOTEL_ROOM_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { hotel_room_id } = req.query as { hotel_room_id?: string };

      let query = knex("hotel_room_features")
        .whereNull("hotel_room_features.deleted_at")
        .select(
          "hotel_room_features.*",
          "hotel_room_feature_pivots.name"
        )
        .innerJoin(
          "hotel_room_feature_pivots",
          "hotel_room_features.id",
          "hotel_room_feature_pivots.hotel_room_feature_id"
        )
        .where("hotel_room_feature_pivots.language_code", language)
        .whereNull("hotel_room_feature_pivots.deleted_at");

      if (hotel_room_id) {
        query = query.where(
          "hotel_room_features.hotel_room_id",
          hotel_room_id
        );
      }

      const features = await query;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_FEATURE.FETCHED_SUCCESS"),
        data: features,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const feature = await knex("hotel_room_features")
        .whereNull("hotel_room_features.deleted_at")
        .where("hotel_room_features.id", id)
        .select(
          "hotel_room_features.*",
          "hotel_room_feature_pivots.name"
        )
        .innerJoin(
          "hotel_room_feature_pivots",
          "hotel_room_features.id",
          "hotel_room_feature_pivots.hotel_room_feature_id"
        )
        .where("hotel_room_feature_pivots.language_code", req.language)
        .first();

      if (!feature) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_FEATURE.NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_FEATURE.FETCHED_SUCCESS"),
        data: feature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { hotel_room_id, name, status } = req.body as {
        hotel_room_id: string;
        name: string;
        status: boolean;
      };

      // Validate hotel_room_id
      const existingHotelRoom = await new HotelRoomModel().exists({
        id: hotel_room_id,
      });

      if (!existingHotelRoom) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_ROOM.NOT_FOUND"),
        });
      }

      // Create hotel room feature
      const feature = await new HotelRoomFeatureModel().create({
        hotel_room_id,
        status,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "hotel_room_feature_pivots",
        target_id_key: "hotel_room_feature_id",
        target_id: feature.id,
        language_code: (req as any).language,
        data: {
          name,
        },
      });

      feature.translations = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_FEATURE.CREATED_SUCCESS"),
        data: feature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM_FEATURE.CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { hotel_room_id, name, status } = req.body as {
        hotel_room_id?: string;
        name?: string;
        status?: boolean;
      };

      // Check if anything to update
      if (!hotel_room_id && !name && status === undefined) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_ROOM_FEATURE.NO_UPDATE_DATA"),
        });
      }

      // Check feature existence
      const existingFeature = await knex("hotel_room_features")
        .where("id", id)
        .first();

      if (!existingFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_FEATURE.NOT_FOUND"),
        });
      }

      // Validate hotel room if hotel_room_id is provided
      if (hotel_room_id) {
        const hotelRoom = await knex("hotel_rooms")
          .where("id", hotel_room_id)
          .first();

        if (!hotelRoom) {
          return res.status(400).send({
            success: false,
            message: req.t("HOTEL_ROOM.NOT_FOUND"),
          });
        }
      }

      // Update feature
      const updateData: any = {};
      if (hotel_room_id) updateData.hotel_room_id = hotel_room_id;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await knex("hotel_room_features")
          .where("id", id)
          .update(updateData);
      }

      // Update translations if name provided
      if (name) {
        await translateUpdate({
          target: "hotel_room_feature_pivots",
          target_id_key: "hotel_room_feature_id",
          target_id: id,
          data: { name },
          language_code: (req as any).language,
        });
      }

      // Get updated feature with translations
      const updatedFeature = await knex("hotel_room_features")
        .where("hotel_room_features.id", id)
        .select(
          "hotel_room_features.*",
          "hotel_room_feature_pivots.name"
        )
        .leftJoin(
          "hotel_room_feature_pivots",
          "hotel_room_features.id",
          "hotel_room_feature_pivots.hotel_room_feature_id"
        )
        .where("hotel_room_feature_pivots.language_code", (req as any).language)
        .first();

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_FEATURE.UPDATED_SUCCESS"),
        data: updatedFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM_FEATURE.UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingFeature = await new HotelRoomFeatureModel().exists({ id });

      if (!existingFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_FEATURE.NOT_FOUND"),
        });
      }

      await new HotelRoomFeatureModel().delete(id);
      await knex("hotel_room_feature_pivots")
        .where("hotel_room_feature_id", id)
        .update({ deleted_at: new Date() });
      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_FEATURE.DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM_FEATURE.DELETED_ERROR"),
      });
    }
  }
}
