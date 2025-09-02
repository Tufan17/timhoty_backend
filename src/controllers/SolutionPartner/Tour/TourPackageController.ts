import { FastifyReply, FastifyRequest } from "fastify";
import knex from "@/db/knex";
import TourPackageModel from "@/models/TourPackageModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import TourModel from "@/models/TourModel";
import TourPackagePriceModel from "@/models/TourPackagePriceModel";

interface CreatePackageBody {
  tour_id: string;
  discount?: number;
  total_tax_amount?: number;
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
  }>;
}

interface UpdatePackageBody {
  discount?: number;
  total_tax_amount?: number;
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
              this.where("tour_packages.discount", "ilike", like).orWhere(
                "tour_packages.total_tax_amount",
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
        .groupBy("tour_packages.id", "tour_package_pivots.name", "tour_package_pivots.description", "tour_package_pivots.refund_policy");

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

      // The previous query failed because of referencing "tour_package.date" in the JSON aggregation,
      // but there is no such table alias. We'll fix this by removing the invalid reference and only using available columns.

      const packageModel = await knex
        .select(
          "tour_packages.*",
          "tour_packages.date",
          knex.raw(`
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
        .innerJoin(
          "tour_package_prices",
          "tour_packages.id",
          "tour_package_prices.tour_package_id"
        )
        .where("tour_packages.id", id)
        .whereNull("tour_package_prices.deleted_at")
        .whereNull("tour_packages.deleted_at")
        .innerJoin(
          "currency_pivots",
          "tour_package_prices.currency_id",
          "currency_pivots.currency_id"
        )
        .where("currency_pivots.language_code", req.language)
        .innerJoin(
          "currencies",
          "tour_package_prices.currency_id",
          "currencies.id"
        )
        .groupBy(
          "tour_packages.id",
          "tour_packages.date",
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
        discount,
        total_tax_amount,
        constant_price,
        name,
        description,
        refund_policy,
        return_acceptance_period,
        prices,
        date,
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

      // tarihlerler kendli içinde çakışıyor mu ve constant_price true ise prices sadece 1 tane olmalı
      if (constant_price) {
        if (prices.length > 1) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR_PACKAGE.PRICE_COUNT_ERROR"),
          });
        }
      }

      // tarihlerler kendli içinde çakışıyor mu
      let conflict = false;
      if (prices.length > 1) {
        for (const price of prices) {
          for (const price2 of prices) {
            if (
              price.start_date &&
              price2.start_date &&
              price.end_date &&
              price2.end_date
            ) {
              if (
                price !== price2 &&
                new Date(price.start_date) >= new Date(price2.start_date) &&
                new Date(price.start_date) <= new Date(price2.end_date)
              ) {
                conflict = true;
              }
            }
          }
        }
      }
      if (conflict) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE.DATE_RANGE_ERROR"),
        });
      }
      const packageModel = await new TourPackageModel().create({
        tour_id,
        discount,
        total_tax_amount,
        constant_price,
        return_acceptance_period,
        date,
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

      let pricesModel = [];
      for (const price of prices || []) {
        const priceModel = await new TourPackagePriceModel().create({
          tour_package_id: packageModel.id,
          main_price: price.main_price,
          child_price: price.child_price,
          baby_price: price.baby_price,
          period: price.period,
          quota: price.quota,
          currency_id: price.currency_id,
          start_date: price.start_date,
          end_date: price.end_date,
        });
        pricesModel.push(priceModel);
      }

      packageModel.prices = pricesModel;
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
        discount,
        total_tax_amount,
        constant_price,
        return_acceptance_period,
        refund_policy,
        name,
        description,
        prices,
        date,
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

      // constant_price true ise prices sadece 1 tane olmalı
      if (constant_price) {
        if (prices && prices.length > 1) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR_PACKAGE.PRICE_COUNT_ERROR"),
          });
        }
      }

      // tarihlerler kendli içinde çakışıyor mu
      let conflict = false;
      if (prices && prices.length > 1) {
        for (const price of prices) {
          for (const price2 of prices) {
            if (
              price.start_date &&
              price2.start_date &&
              price.end_date &&
              price2.end_date
            ) {
              if (
                price !== price2 &&
                new Date(price.start_date) >= new Date(price2.start_date) &&
                new Date(price.start_date) <= new Date(price2.end_date)
              ) {
                conflict = true;
              }
            }
          }
        }
      }
      if (conflict) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE.DATE_RANGE_ERROR"),
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



      // Update package
      await knex("tour_packages")
        .update({
          discount,
          total_tax_amount,
          constant_price,
          return_acceptance_period,
          date,
        })
        .where("id", id)
        .whereNull("deleted_at");

      // Delete old prices
      await knex("tour_package_prices")
        .del()
        .where("tour_package_id", id)
        .whereNull("deleted_at");

      // Create new prices
      let pricesModel = [];
      for (const price of prices || [] as any) {
        const priceModel = await new TourPackagePriceModel().create({
          tour_package_id: id,
          main_price: price.main_price,
          child_price: price.child_price,
          baby_price: price.baby_price,
          period: price.period,
          quota: price.quota,
          currency_id: price.currency_id,
          start_date: price.start_date,
          end_date: price.end_date,
        });
        pricesModel.push(priceModel);
      }

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
