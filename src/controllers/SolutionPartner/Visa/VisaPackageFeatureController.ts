import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import VisaPackageFeatureModel from "@/models/VisaPackageFeatureModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import VisaPackageModel from "@/models/VisaPackageModel";

export default class VisaPackageFeatureController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        visa_package_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        visa_package_id?: string;
      };

      const language = (req as any).language;

      // Base query with JOINs
      const base = knex("visa_package_features")
        .whereNull("visa_package_features.deleted_at")
        .innerJoin(
          "visa_package_feature_pivots",
          "visa_package_features.id",
          "visa_package_feature_pivots.visa_package_feature_id"
        )
        .innerJoin(
          "visa_packages",
          "visa_package_features.visa_package_id",
          "visa_packages.id"
        )
        .where("visa_package_feature_pivots.language_code", language)
        .whereNull("visa_package_feature_pivots.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .modify((qb) => {
          if (visa_package_id) {
            qb.where("visa_package_features.visa_package_id", visa_package_id);
          }

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("visa_package_feature_pivots.name", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("visa_package_features.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("visa_package_features.id")
        .select("visa_package_features.*", "visa_package_feature_pivots.name")
        .orderBy("visa_package_features.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_FEATURE.FETCHED_SUCCESS"),
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
        message: req.t("VISA_PACKAGE_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { visa_package_id } = req.query as { visa_package_id?: string };

      let query = knex("visa_package_features")
        .whereNull("visa_package_features.deleted_at")
        .select("visa_package_features.*", "visa_package_feature_pivots.name")
        .innerJoin(
          "visa_package_feature_pivots",
          "visa_package_features.id",
          "visa_package_feature_pivots.visa_package_feature_id"
        )
        .where("visa_package_feature_pivots.language_code", language)
        .whereNull("visa_package_feature_pivots.deleted_at");

      if (visa_package_id) {
        query = query.where(
          "visa_package_features.visa_package_id",
          visa_package_id
        );
      }

      const features = await query;

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_FEATURE.FETCHED_SUCCESS"),
        data: features,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const feature = await knex("visa_package_features")
        .whereNull("visa_package_features.deleted_at")
        .where("visa_package_features.id", id)
        .select("visa_package_features.*", "visa_package_feature_pivots.name")
        .innerJoin(
          "visa_package_feature_pivots",
          "visa_package_features.id",
          "visa_package_feature_pivots.visa_package_feature_id"
        )
        .where("visa_package_feature_pivots.language_code", req.language)
        .first();

      if (!feature) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_FEATURE.FETCHED_SUCCESS"),
        data: feature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_FEATURE.FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { visa_package_id, name, status } = req.body as {
        visa_package_id: string;
        name: string;
        status: boolean;
      };

      // Validate hotel_room_id
      const existingVisaPackage = await new VisaPackageModel().exists({
        id: visa_package_id,
      });

      if (!existingVisaPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("VISA_PACKAGE.NOT_FOUND"),
        });
      }

      // Create hotel room feature
      const feature = await new VisaPackageFeatureModel().create({
        visa_package_id,
        status,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "visa_package_feature_pivots",
        target_id_key: "visa_package_feature_id",
        target_id: feature.id,
        language_code: (req as any).language,
        data: {
          name,
        },
      });

      feature.translations = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_FEATURE.CREATED_SUCCESS"),
        data: feature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_FEATURE.CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { visa_package_id, name, status } = req.body as {
        visa_package_id?: string;
        name?: string;
        status?: boolean;
      };

      // Check if anything to update
      if (!visa_package_id && !name && status === undefined) {
        return res.status(400).send({
          success: false,
          message: req.t("VISA_PACKAGE_FEATURE.NO_UPDATE_DATA"),
        });
      }

      // Check feature existence
      const existingFeature = await knex("visa_package_features")
        .where("id", id)
        .first();

      if (!existingFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      // Validate hotel room if hotel_room_id is provided
      if (visa_package_id) {
        const visaPackage = await knex("visa_packages")
          .where("id", visa_package_id)
          .first();

        if (!visaPackage) {
          return res.status(400).send({
            success: false,
            message: req.t("VISA_PACKAGE.NOT_FOUND"),
          });
        }
      }

      // Update feature
      const updateData: any = {};
      if (visa_package_id) updateData.visa_package_id = visa_package_id;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await knex("visa_package_features").where("id", id).update(updateData);
      }

      // Update translations if name provided
      if (name) {
        await translateUpdate({
          target: "visa_package_feature_pivots",
          target_id_key: "visa_package_feature_id",
          target_id: id,
          data: { name },
          language_code: (req as any).language,
        });
      }

      // Get updated feature with translations
      const updatedFeature = await knex("visa_package_features")
        .where("visa_package_features.id", id)
        .select("visa_package_features.*", "visa_package_feature_pivots.name")
        .leftJoin(
          "visa_package_feature_pivots",
          "visa_package_features.id",
          "visa_package_feature_pivots.visa_package_feature_id"
        )
        .where(
          "visa_package_feature_pivots.language_code",
          (req as any).language
        )
        .first();

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_FEATURE.UPDATED_SUCCESS"),
        data: updatedFeature,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_FEATURE.UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingFeature = await new VisaPackageFeatureModel().exists({
        id,
      });

      if (!existingFeature) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE_FEATURE.NOT_FOUND"),
        });
      }

      await new VisaPackageFeatureModel().delete(id);
      await knex("visa_package_feature_pivots")
        .where("visa_package_feature_id", id)
        .update({ deleted_at: new Date() });
      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_FEATURE.DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_FEATURE.DELETED_ERROR"),
      });
    }
  }
}
