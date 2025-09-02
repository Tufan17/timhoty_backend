import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourPackageFeatureModel from "@/models/TourPackageFeatureModel";
import { translateCreate, translateUpdate } from "@/helper/translate";  
import TourPackageModel from "@/models/TourPackageModel";

  export default class TourPackageFeatureController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        tour_package_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        tour_package_id?: string;
      };

      const language = (req as any).language;

      // Base query with JOINs
      const base = knex("tour_package_features")
        .whereNull("tour_package_features.deleted_at")
        .innerJoin(
          "tour_package_feature_pivots",
          "tour_package_features.id",
          "tour_package_feature_pivots.tour_package_feature_id"
        )
        .innerJoin(
          "tour_packages",
          "tour_package_features.tour_package_id",
          "tour_packages.id"
        )
        .where("tour_package_feature_pivots.language_code", language)
        .whereNull("tour_package_feature_pivots.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .modify((qb) => {
          if (tour_package_id) {
            qb.where("tour_package_features.tour_package_id", tour_package_id);
          }

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_package_feature_pivots.name", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("tour_package_features.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("tour_package_features.id")
        .select("tour_package_features.*", "tour_package_feature_pivots.name")
        .orderBy("tour_package_features.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_FEATURE.FETCHED_SUCCESS"),
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
        message: req.t("TOUR_PACKAGE_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { tour_package_id } = req.query as { tour_package_id?: string };

      let query = knex("tour_package_features")
        .whereNull("tour_package_features.deleted_at")
        .select("tour_package_features.*", "tour_package_feature_pivots.name")
        .innerJoin(
          "tour_package_feature_pivots",
          "tour_package_features.id",
          "tour_package_feature_pivots.tour_package_feature_id"
        )
          .where("tour_package_feature_pivots.language_code", language)
        .whereNull("tour_package_feature_pivots.deleted_at");

      if (tour_package_id) {
        query = query.where(
          "tour_package_features.tour_package_id",
          tour_package_id
        );
      }

      const features = await query;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_FEATURE.FETCHED_SUCCESS"),
        data: features,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const feature = await knex("tour_package_features")
        .whereNull("tour_package_features.deleted_at")
        .where("tour_package_features.id", id)
        .select("tour_package_features.*", "tour_package_feature_pivots.name")
        .innerJoin(
          "tour_package_feature_pivots",
          "tour_package_features.id",
          "tour_package_feature_pivots.tour_package_feature_id"
        )
        .where("tour_package_feature_pivots.language_code", (req as any).language)
        .first();

      if (!feature) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_FEATURE.FETCHED_SUCCESS"),
        data: feature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
        const { tour_package_id, name, status } = req.body as {
        tour_package_id: string;
        name: string;
        status: boolean;
      };

      // Validate tour_package_id
      const existingTourPackage = await new TourPackageModel().exists({
        id: tour_package_id,
      });

      if (!existingTourPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      // Create hotel room feature
      const feature = await new TourPackageFeatureModel().create({
        tour_package_id,
        status,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "tour_package_feature_pivots",
        target_id_key: "tour_package_feature_id",
        target_id: feature.id,
        language_code: (req as any).language,
        data: {
          name,
        },
      });

      feature.translations = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_FEATURE.CREATED_SUCCESS"),
        data: feature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_FEATURE.CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { tour_package_id, name, status } = req.body as {
        tour_package_id?: string;
        name?: string;
        status?: boolean;
      };

      // Check if anything to update
      if (!tour_package_id && !name && status === undefined) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE_FEATURE.NO_UPDATE_DATA"),
        });
      }

      // Check feature existence
      const existingFeature = await knex("tour_package_features")
        .where("id", id)
        .first();

      if (!existingFeature) {
        return res.status(404).send({
          success: false,
            message: req.t("TOUR_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      // Validate hotel room if hotel_room_id is provided
        if (tour_package_id) {
        const tourPackage = await knex("tour_packages")
          .where("id", tour_package_id)
          .first();

        if (!tourPackage) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR_PACKAGE_FEATURE.NOT_FOUND"),
          });
        }
      }

      // Update feature
      const updateData: any = {};
      if (tour_package_id) updateData.tour_package_id = tour_package_id;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await knex("tour_package_features").where("id", id).update(updateData);
      }

      // Update translations if name provided
      if (name) {
        await translateUpdate({
          target: "tour_package_feature_pivots",
          target_id_key: "tour_package_feature_id",
          target_id: id,
          data: { name },
          language_code: (req as any).language,
        });
      }

      // Get updated feature with translations
      const updatedFeature = await knex("tour_package_features")
        .where("tour_package_features.id", id)
        .select("tour_package_features.*", "tour_package_feature_pivots.name")
        .leftJoin(
          "tour_package_feature_pivots",
          "tour_package_features.id",
          "tour_package_feature_pivots.tour_package_feature_id"
        )
        .where(
          "tour_package_feature_pivots.language_code",
          (req as any).language
        )
        .first();

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_FEATURE.UPDATED_SUCCESS"),
        data: updatedFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_FEATURE.UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
          const existingFeature = await new TourPackageFeatureModel().exists({
        id,
      });

      if (!existingFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      await new TourPackageFeatureModel().delete(id);
      await knex("tour_package_feature_pivots")
        .where("tour_package_feature_id", id)
        .update({ deleted_at: new Date() });
      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_FEATURE.DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_FEATURE.DELETED_ERROR"),
      });
    }
  }
}
