import { FastifyReply, FastifyRequest } from "fastify";
import knex from "@/db/knex";
import TourPackageModel from "@/models/TourPackageModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import TourModel from "@/models/TourModel";
import TourPackagePriceModel from "@/models/TourPackagePriceModel";

interface CreatePackageBody {
  tour_id: string;
  constant_price: boolean;
  name: string;
  description: string;
  refund_policy: string;
  return_acceptance_period: number;
  date: string;
  prices: Array<{
    main_price: number;
    child_price?: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
    period?: string;
    quota?: number;
    baby_price?: number;
    discount?: number;
    total_tax_amount?: number;
  }>;
}

interface UpdatePackageBody {
  constant_price?: boolean;
  return_acceptance_period?: number;
  name?: string;
  description?: string;
  refund_policy?: string;
  date?: string;
  prices?: Array<{
    main_price: number;
    child_price?: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
    period?: string;
    quota?: number;
    baby_price?: number;
    discount?: number;
    total_tax_amount?: number;
  }>;
}

export class TourPackageController {
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
        tour_id: string;
      };

      const query = knex("tour_packages")
        .whereNull("tour_packages.deleted_at")
        .where("tour_packages.tour_id", tour_id)
        .leftJoin(
          "tour_package_prices",
          "tour_packages.id",
          "tour_package_prices.tour_package_id"
        )
        .whereNull("tour_package_prices.deleted_at")
        .where(function () {
          if (search) {
            const like = `%${search}%`;
            this.where(function () {
              this.where("tour_package_prices.discount", "ilike", like).orWhere(
                "tour_package_prices.total_tax_amount",
                "ilike",
                like
              );

              if (
                search.toLowerCase() === "true" ||
                search.toLowerCase() === "false"
              ) {
                this.orWhere(
                  "tour_packages.constant_price",
                  search.toLowerCase() === "true"
                );
              }
            });
          }
        })
        .select(
          "tour_packages.*",
          knex.raw("json_agg(tour_package_prices.*) as prices")
        )
        .groupBy("tour_packages.id");

      const countResult = await knex("tour_packages")
        .whereNull("deleted_at")
        .where("tour_id", tour_id)
        .count("* as total")
        .first();
      const total = Number(countResult?.total ?? 0);

      const offset = (page - 1) * limit;
      const packages = await query.limit(limit).offset(offset);

      return res.send({
        data: packages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error in dataTable:", error);
      return res.status(500).send({
        message: req.t("GENERAL.ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tour_id } = req.query as { tour_id: string };

      const packages = await knex
        .select(
          "tour_packages.*",
          knex.raw(`
            json_agg(
              json_build_object(
                  'id', tour_package_prices.id,
                'tour_package_id', tour_package_prices.tour_package_id,
                'main_price', tour_package_prices.main_price,
                'child_price', tour_package_prices.child_price,
                'currency_id', tour_package_prices.currency_id,
                'start_date', tour_package_prices.start_date,
                  'end_date', tour_package_prices.end_date,
                'created_at', tour_package_prices.created_at,
                'updated_at', tour_package_prices.updated_at,
                'deleted_at', tour_package_prices.deleted_at
              )
            ) as prices
          `),
          "tour_package_pivots.name",
          "tour_package_pivots.description",
          "tour_package_pivots.refund_policy"
        )
        .from("tour_packages")
        .innerJoin(
          "tour_package_pivots",
          "tour_packages.id",
          "tour_package_pivots.tour_package_id"
        )
        .where("tour_package_pivots.language_code", req.language)
        .leftJoin(
          "tour_package_prices",
          "tour_packages.id",
          "tour_package_prices.tour_package_id"
        )
        .where("tour_packages.tour_id", tour_id)
        .whereNull("tour_packages.deleted_at")
        .groupBy(
          "tour_packages.id",
          "tour_package_pivots.name",
          "tour_package_pivots.description",
          "tour_package_pivots.refund_policy"
        );

      return res.send(packages);
    } catch (error) {
      console.error("Error in findAll:", error);
      return res.status(500).send({
        message: req.t("GENERAL.ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const packageModel = await knex
        .select(
          "tour_packages.*",
          "tour_packages.return_acceptance_period",
          knex.raw(`
            COALESCE(
              json_agg(
                json_build_object(
                  'id', tour_package_prices.id,
                  'tour_package_id', tour_package_prices.tour_package_id,
                  'main_price', tour_package_prices.main_price,
                  'child_price', tour_package_prices.child_price,
                  'baby_price', tour_package_prices.baby_price,
                  'period', tour_package_prices.period,
                  'quota', tour_package_prices.quota,
                  'currency_id', tour_package_prices.currency_id,
                  'currency_name', currency_pivots.name,
                  'code', currencies.code,
                  'discount', tour_package_prices.discount,
                  'total_tax_amount', tour_package_prices.total_tax_amount,
                  'date', tour_package_prices.date,
                  'created_at', tour_package_prices.created_at,
                  'updated_at', tour_package_prices.updated_at,
                  'deleted_at', tour_package_prices.deleted_at
                )
              ) FILTER (WHERE tour_package_prices.id IS NOT NULL),
              '[]'::json
            ) as prices
          `),
          "tour_package_pivots.name",
          "tour_package_pivots.description",
          "tour_package_pivots.refund_policy"
        )
        .from("tour_packages")
        .innerJoin(
          "tour_package_pivots",
          "tour_packages.id",
          "tour_package_pivots.tour_package_id"
        )
        .where("tour_package_pivots.language_code", req.language)
        .leftJoin(
          "tour_package_prices",
          function() {
            this.on("tour_packages.id", "tour_package_prices.tour_package_id")
              .andOnNull("tour_package_prices.deleted_at")
          }
        )
        .leftJoin(
          "currency_pivots",
          function() {
            this.on("tour_package_prices.currency_id", "currency_pivots.currency_id")
              .andOn("currency_pivots.language_code", knex.raw("?", [req.language]))
          }
        )
        .leftJoin(
          "currencies",
          "tour_package_prices.currency_id",
          "currencies.id"
        )
        .where("tour_packages.id", id)
        .whereNull("tour_packages.deleted_at")
        .groupBy(
          "tour_packages.id",
          "tour_package_pivots.name",
          "tour_package_pivots.description",
          "tour_package_pivots.refund_policy"
        )
        .first();

      // Optionally, you can fetch images and features as before if needed

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE.NOT_FOUND"),
        });
      }

      const tourPackageFeatures = await knex("tour_package_features")
        .where("tour_package_features.tour_package_id", id)
        .whereNull("tour_package_features.deleted_at")
        .innerJoin(
          "tour_package_feature_pivots",
          "tour_package_features.id",
          "tour_package_feature_pivots.tour_package_feature_id"
        )
        .where(
          "tour_package_feature_pivots.language_code",
          (req as any).language
        )
        .select("tour_package_features.*", "tour_package_feature_pivots.name");
      packageModel.tour_package_features = tourPackageFeatures;

      const tourPackageImages = await knex("tour_package_images")
        .where("tour_package_images.tour_package_id", id)
        .whereNull("tour_package_images.deleted_at")
        .select("tour_package_images.*");
      packageModel.tour_package_images = tourPackageImages;

      const tourPackageOpportunities = await knex("tour_package_opportunities")
        .where("tour_package_opportunities.tour_package_id", id)
        .whereNull("tour_package_opportunities.deleted_at")
        .innerJoin(
          "tour_package_opportunity_pivots",
          "tour_package_opportunities.id",
          "tour_package_opportunity_pivots.tour_package_opportunity_id"
        )
        .where(
          "tour_package_opportunity_pivots.language_code",
          (req as any).language
        )
        .whereNull("tour_package_opportunity_pivots.deleted_at")
        .select(
          "tour_package_opportunities.*",
          "tour_package_opportunity_pivots.name"
        );
      packageModel.tour_package_opportunities = tourPackageOpportunities;

      return res.status(200).send({
        success: true,
        data: packageModel,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("GENERAL.ERROR"),
      });
    }
  }
  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        tour_id,
        name,
        description,
        refund_policy,
        return_acceptance_period
      } = req.body as CreatePackageBody;

      const existingTour = await new TourModel().exists({
        id: tour_id,
      });

      if (!existingTour) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE.TOUR_PACKAGE_NOT_FOUND"),
        });
      }

      const packageModel = await new TourPackageModel().create({
        tour_id,
        return_acceptance_period,
      });

      await translateCreate({
        target: "tour_package_pivots",
        target_id_key: "tour_package_id",
        target_id: packageModel.id,
        language_code: (req as any).language,
        data: {
          name,
          description,
          refund_policy,
        },
      });
      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE.CREATED_SUCCESS"),
        data: packageModel,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("GENERAL.ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: number };
      const {
        return_acceptance_period,
        refund_policy,
        name,
        description,
      } = req.body as UpdatePackageBody;

      const packageModel = await knex
        .select(
          "tour_packages.*",
          knex.raw("json_agg(tour_package_prices.*) as prices")
        )
        .from("tour_packages")
        .leftJoin(
          "tour_package_prices",
          "tour_packages.id",
          "tour_package_prices.tour_package_id"
        )
        .where("tour_packages.id", id)
        .whereNull("tour_package_prices.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .groupBy("tour_packages.id")
        .first();

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE.NOT_FOUND"),
        });
      }

      

    
    
      await translateUpdate({
        target: "tour_package_pivots",
        target_id: id.toString(),
        target_id_key: "tour_package_id",
        language_code: (req as any).language,
        data: {
          name,
          description,
          refund_policy,
        },
      });

      // Get updated package with prices
      const updatedPackage = await knex
        .select(
          "tour_packages.*",
          knex.raw("json_agg(tour_package_prices.*) as prices")
        )
        .from("tour_packages")
        .leftJoin(
          "tour_package_prices",
          "tour_packages.id",
          "tour_package_prices.tour_package_id"
        )
        .where("tour_packages.id", id)
        .whereNull("tour_package_prices.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .groupBy("tour_packages.id")
        .first();

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE.UPDATED_SUCCESS"),
        data: updatedPackage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("GENERAL.ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      // Check if package exists
      const existingPackage = await knex("tour_packages")
        .where("id", id)
        .whereNull("deleted_at")
        .first();

      if (!existingPackage) {
        return res.status(404).send({
          success: false,
          message: req.t("GENERAL.NOT_FOUND"),
        });
      }

      // Soft delete package
      await knex("tour_packages")
        .where("id", id)
        .update({ deleted_at: knex.fn.now() });

      // Soft delete pivot
      await knex("tour_package_pivots")
        .where("tour_package_id", id)
        .update({ deleted_at: knex.fn.now() });

      // Soft delete prices
      await knex("tour_package_prices")
        .where("tour_package_id", id)
        .update({ deleted_at: knex.fn.now() });

      return res.send({
        success: true,
        message: req.t("GENERAL.DELETED"),
        data: null,
        error: null,
      });
    } catch (error) {
      console.error("Error in delete:", error);
      return res.status(500).send({
        success: false,
        message: req.t("GENERAL.ERROR"),
        data: null,
        error: error,
      });
    }
  }
}
