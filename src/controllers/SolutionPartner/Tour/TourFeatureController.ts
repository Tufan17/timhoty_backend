import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourFeatureModel from "@/models/TourFeatureModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import TourModel from "@/models/TourModel";

export default class HotelFeatureController {
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

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      // Base query with JOINs
      const base = knex("tour_features")
        .whereNull("tour_features.deleted_at")
        .innerJoin(
          "tour_feature_pivots",
          "tour_features.id",
          "tour_feature_pivots.tour_feature_id"
        )
        .innerJoin("tours", "tour_features.tour_id", "tours.id")
        .where("tour_feature_pivots.language_code", language)
        .whereNull("tour_feature_pivots.deleted_at")
        .whereNull("tours.deleted_at")
        .modify((qb) => {
          // Filter by solution partner from authenticated user
          if (spFromUser) qb.where("tours.solution_partner_id", spFromUser);

          if (tour_id) qb.where("tour_features.tour_id", tour_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("tour_feature_pivots.name", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("tour_features.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("tour_features.id")
        .select(
          "tour_features.*",
          "tour_feature_pivots.name",
          "tours.location_id"
        )
        .orderBy("tour_features.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_FETCHED_SUCCESS"),
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
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { tour_id } = req.query as { tour_id?: string };

      let query = knex("tour_features")
        .whereNull("tour_features.deleted_at")
        .select("tour_features.*", "tour_feature_pivots.name")
        .innerJoin(
          "tour_feature_pivots",
          "tour_features.id",
          "tour_feature_pivots.tour_feature_id"
        )
        .where("tour_feature_pivots.language_code", language)
        .whereNull("tour_feature_pivots.deleted_at");

      if (tour_id) {
        query = query.where("tour_features.tour_id", tour_id);
      }

      const tourFeatures = await query;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_FETCHED_SUCCESS"),
        data: tourFeatures,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const tourFeature = await knex("tour_features")
        .whereNull("tour_features.deleted_at")
        .where("tour_features.id", id)
        .select("tour_features.*", "tour_feature_pivots.name")
        .innerJoin(
          "tour_feature_pivots",
          "tour_features.id",
          "tour_feature_pivots.tour_feature_id"
        )
        .where("tour_feature_pivots.language_code", language)
        .whereNull("tour_feature_pivots.deleted_at")
        .first();

      if (!tourFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_FEATURE.TOUR_FEATURE_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_FETCHED_SUCCESS"),
        data: tourFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        tour_id,
        name,
        status = true,
      } = req.body as {
        tour_id: string;
        name: string;
        status?: boolean;
      };

      const existTour = await new TourModel().findId(tour_id);
      if (!existTour) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR.TOUR_NOT_FOUND"),
        });
      }


      // Create tour feature
      const tourFeature = await new TourFeatureModel().create({
        tour_id,
        status,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "tour_feature_pivots",
        target_id_key: "tour_feature_id",
        target_id: tourFeature.id,
        language_code: (req as any).language,
        data: {
          name,
        },
      });

      tourFeature.tour_feature_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_CREATED_SUCCESS"),
        data: tourFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { tour_id, name, status } = req.body as {
        tour_id?: string;
        name?: string;
        status?: boolean;
      };

      const existingTourFeature = await new TourFeatureModel().first({ id });

      if (!existingTourFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_FEATURE.TOUR_FEATURE_NOT_FOUND"),
        });
      }

      // Validate tour_id if provided
      if (tour_id) {
        const existingTour = await new TourModel().first({
          "tours.id": tour_id,
        });

        if (!existingTour) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR.TOUR_NOT_FOUND"),
          });
        }
      }

      // Update tour feature if tour_id or status is provided
      if (tour_id || status !== undefined) {
        await new TourFeatureModel().update(id, {
          ...(tour_id && { tour_id }),
          ...(status !== undefined && { status }),
        });
      }

      // Update translations if name is provided
      if (name) {
        await translateUpdate({
          target: "tour_feature_pivots",
          target_id_key: "tour_feature_id",
          target_id: id,
          data: {
            name,
          },
          language_code: (req as any).language,
        });
      }

      const updatedTourFeature = await new TourFeatureModel().oneToMany(
        id,
        "tour_feature_pivots",
        "tour_feature_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_UPDATED_SUCCESS"),
        data: updatedTourFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingTourFeature = await new TourFeatureModel().first({ id });

      if (!existingTourFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_FEATURE.TOUR_FEATURE_NOT_FOUND"),
        });
      }

      await new TourFeatureModel().delete(id);
      await knex("tour_feature_pivots")
        .where("tour_feature_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_FEATURE.TOUR_FEATURE_DELETED_ERROR"),
      });
    }
  }
}
