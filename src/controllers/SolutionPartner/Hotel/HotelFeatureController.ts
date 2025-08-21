import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import HotelFeatureModel from "@/models/HotelFeatureModel";
import HotelFeaturePivotModel from "@/models/HotelFeaturePivotModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import HotelModel from "@/models/HotelModel";

export default class HotelFeatureController {
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

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      // Base query with JOINs
      const base = knex("hotel_features")
        .whereNull("hotel_features.deleted_at")
        .innerJoin("hotel_feature_pivots", "hotel_features.id", "hotel_feature_pivots.hotel_feature_id")
        .innerJoin("hotels", "hotel_features.hotel_id", "hotels.id")
        .where("hotel_feature_pivots.language_code", language)
        .whereNull("hotel_feature_pivots.deleted_at")
        .whereNull("hotels.deleted_at")
        .modify((qb) => {
          // Filter by solution partner from authenticated user
          if (spFromUser) qb.where("hotels.solution_partner_id", spFromUser);

          if (hotel_id) qb.where("hotel_features.hotel_id", hotel_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_feature_pivots.name", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("hotel_features.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("hotel_features.id")
        .select(
          "hotel_features.*",
          "hotel_feature_pivots.name",
          "hotels.location_id"
        )
        .orderBy("hotel_features.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_FETCHED_SUCCESS"),
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
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { hotel_id } = req.query as { hotel_id?: string };

      let query = knex("hotel_features")
        .whereNull("hotel_features.deleted_at")
        .select(
          "hotel_features.*", 
          "hotel_feature_pivots.name"
        )
        .innerJoin("hotel_feature_pivots", "hotel_features.id", "hotel_feature_pivots.hotel_feature_id")
        .where("hotel_feature_pivots.language_code", language)
        .whereNull("hotel_feature_pivots.deleted_at");

      if (hotel_id) {
        query = query.where("hotel_features.hotel_id", hotel_id);
      }

      const hotelFeatures = await query;
      
      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_FETCHED_SUCCESS"),
        data: hotelFeatures,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const hotelFeature = await knex("hotel_features")
        .whereNull("hotel_features.deleted_at")
        .where("hotel_features.id", id)
        .select(
          "hotel_features.*", 
          "hotel_feature_pivots.name"
        )
        .innerJoin("hotel_feature_pivots", "hotel_features.id", "hotel_feature_pivots.hotel_feature_id")
        .where("hotel_feature_pivots.language_code", language)
        .whereNull("hotel_feature_pivots.deleted_at")
        .first();

      if (!hotelFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_FETCHED_SUCCESS"),
        data: hotelFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        hotel_id,
        name,
        status = true
      } = req.body as {
        hotel_id: string;
        name: string;
        status?: boolean;
      };

      const existHotel = await new HotelModel().findId(hotel_id);
      if (!existHotel) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      // Validate hotel_id
      const existingFeature = await new HotelFeatureModel().existFeature({
        hotel_id,
        name,
      });

      if (existingFeature) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_ALREADY_EXISTS"),
        });
      } 

      // Create hotel feature
      const hotelFeature = await new HotelFeatureModel().create({
        hotel_id,
        status,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "hotel_feature_pivots",
        target_id_key: "hotel_feature_id",
        target_id: hotelFeature.id,
        language_code: (req as any).language,
        data: {
          name,
        },
      });

      hotelFeature.hotel_feature_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_CREATED_SUCCESS"),
        data: hotelFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { 
        hotel_id,
        name,
        status
      } = req.body as {
        hotel_id?: string;
        name?: string;
        status?: boolean;
      };

      const existingHotelFeature = await new HotelFeatureModel().first({ id });

      if (!existingHotelFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_NOT_FOUND"),
        });
      }

      // Validate hotel_id if provided
      if (hotel_id) {
        const existingHotel = await new HotelModel().first({
          "hotels.id": hotel_id,
        });

        if (!existingHotel) {
          return res.status(400).send({
            success: false,
            message: req.t("HOTEL.HOTEL_NOT_FOUND"),
          });
        }
      }

      // Update hotel feature if hotel_id or status is provided
      if (hotel_id || status !== undefined) {
        await new HotelFeatureModel().update(id, {
          ...(hotel_id && { hotel_id }),
          ...(status !== undefined && { status }),
        });
      }
      
      // Update translations if name is provided
      if (name) {
        await translateUpdate({
          target: "hotel_feature_pivots",
          target_id_key: "hotel_feature_id",
          target_id: id,
          data: {
            name,
          },
          language_code: (req as any).language,
        });
      }

      const updatedHotelFeature = await new HotelFeatureModel().oneToMany(
        id,
        "hotel_feature_pivots",
        "hotel_feature_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_UPDATED_SUCCESS"),
        data: updatedHotelFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingHotelFeature = await new HotelFeatureModel().first({ id });

      if (!existingHotelFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_NOT_FOUND"),
        });
      }

      await new HotelFeatureModel().delete(id);
      await knex("hotel_feature_pivots")
        .where("hotel_feature_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_FEATURE.HOTEL_FEATURE_DELETED_ERROR"),
      });
    }
  }
}
