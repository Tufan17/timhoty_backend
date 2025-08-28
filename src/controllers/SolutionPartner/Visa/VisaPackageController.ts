import { FastifyReply, FastifyRequest } from "fastify";
import VisaPackagePriceModel from "@/models/VisaPackagePriceModel";
import knex from "@/db/knex";
import VisaPackageModel from "@/models/VisaPackageModel";
import { translateCreate } from "@/helper/translate";
import VisaModel from "@/models/VisaModel";

interface CreatePackageBody {
  visa_id: string;
  discount?: number;
  total_tax_amount?: number;
  constant_price: boolean;
  name: string;
  description: string;
  refund_policy: string;
  return_acceptance_period: number;
  prices: Array<{
    main_price: number;
    child_price?: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
  }>;
}

interface UpdatePackageBody {
  discount?: number;
  total_tax_amount?: number;
  constant_price: boolean;
  prices?: Array<{
    main_price: number;
    child_price?: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
  }>;
}

export class VisaPackageController {
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
        hotel_room_id: string;
      };

      const query = knex("hotel_room_packages")
        .whereNull("hotel_room_packages.deleted_at")
        .where("hotel_room_packages.hotel_room_id", hotel_room_id)
        .leftJoin(
          "hotel_room_package_prices",
          "hotel_room_packages.id",
          "hotel_room_package_prices.hotel_room_package_id"
        )
        .whereNull("hotel_room_package_prices.deleted_at")
        .where(function () {
          if (search) {
            const like = `%${search}%`;
            this.where(function () {
              // Add searchable fields here
              this.where("hotel_room_packages.discount", "ilike", like).orWhere(
                "hotel_room_packages.total_tax_amount",
                "ilike",
                like
              );

              // Handle boolean search for constant_price
              if (
                search.toLowerCase() === "true" ||
                search.toLowerCase() === "false"
              ) {
                this.orWhere(
                  "hotel_room_packages.constant_price",
                  search.toLowerCase() === "true"
                );
              }
            });
          }
        })
        .select(
          "hotel_room_packages.*",
          knex.raw("json_agg(hotel_room_package_prices.*) as prices")
        )
        .groupBy("hotel_room_packages.id");

      // Get total count - using a separate query without joins to get accurate count
      const countResult = await knex("hotel_room_packages")
        .whereNull("deleted_at")
        .where("hotel_room_id", hotel_room_id)
        .count("* as total")
        .first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get paginated data
      const data = await query
        .clone()
        .orderBy("hotel_room_packages.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_PACKAGE.FETCHED_SUCCESS"),
        data: data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total: total,
        totalPages: totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM_PACKAGE.FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { hotel_room_id } = req.query as { hotel_room_id: string };
      const packageModel = await knex
        .select(
          "hotel_room_packages.*",
          knex.raw("json_agg(hotel_room_package_prices.*) as prices")
        )
        .from("hotel_room_packages")
        .leftJoin(
          "hotel_room_package_prices",
          "hotel_room_packages.id",
          "hotel_room_package_prices.hotel_room_package_id"
        )
        .where("hotel_room_packages.hotel_room_id", hotel_room_id)
        .whereNull("hotel_room_package_prices.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .groupBy("hotel_room_packages.id")
        .orderBy("hotel_room_packages.created_at", "desc");

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

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const packageModel = await knex
        .select(
          "visa_packages.*",
          knex.raw(`
            json_agg(
              json_build_object(
                'id', visa_package_prices.id,
                'visa_package_id', visa_package_prices.visa_package_id,
                'main_price', visa_package_prices.main_price,
                'child_price', visa_package_prices.child_price,
                'currency_id', visa_package_prices.currency_id,
                'currency_name', currency_pivots.name,
                'code', currencies.code,
                'start_date', visa_package_prices.start_date,
                'end_date', visa_package_prices.end_date,
                'created_at', visa_package_prices.created_at,
                'updated_at', visa_package_prices.updated_at,
                'deleted_at', visa_package_prices.deleted_at
              )
            ) as prices
          `),
          "visa_package_pivots.name",
          "visa_package_pivots.description", 
          "visa_package_pivots.refund_policy",
          "currencies.code"
        )
        .from("visa_packages")
        .innerJoin(
          "visa_package_pivots",
          "visa_packages.id",
          "visa_package_pivots.visa_package_id"
        )
        .where("visa_package_pivots.language_code", req.language)
        .innerJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .where("visa_packages.id", id)
        .whereNull("visa_package_prices.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .innerJoin(
          "currency_pivots",
          "visa_package_prices.currency_id",
          "currency_pivots.currency_id"
        )
        .where("currency_pivots.language_code", req.language)
        .innerJoin(
          "currencies",
          "visa_package_prices.currency_id",
          "currencies.id"
        )
        .groupBy(
          "visa_packages.id",
          "visa_package_pivots.name",
          "visa_package_pivots.description",
          "visa_package_pivots.refund_policy",
          "currencies.code"
        )
        .first();

        const visaPackageImages = await knex("visa_package_images")
        .where("visa_package_images.visa_package_id", id)
        .whereNull("visa_package_images.deleted_at")
        .select("visa_package_images.*");
      packageModel.visa_package_images = visaPackageImages;

      const visaPackageFeatures = await knex("visa_package_features")
        .where("visa_package_features.visa_package_id", id)
        .innerJoin(
          "visa_package_feature_pivots",
          "visa_package_features.id",
          "visa_package_feature_pivots.visa_package_feature_id"
        )
        .where("visa_package_feature_pivots.language_code", req.language)
        .whereNull("visa_package_features.deleted_at")
        .select("visa_package_features.*", "visa_package_feature_pivots.name");

      packageModel.visa_package_features = visaPackageFeatures;

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE.NOT_FOUND"),
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
        visa_id,
        discount,
        total_tax_amount,
        constant_price,
        name,
        description,
        refund_policy,
        return_acceptance_period,
        prices,
      } = req.body as CreatePackageBody;

      const existingVisa = await new VisaModel().exists({
        id: visa_id,
      });

      if (!existingVisa) {
        return res.status(400).send({
          success: false,
          message: req.t("VISA_PACKAGE.VISA_PACKAGE_NOT_FOUND"),
        });
      }

      // tarihlerler kendli içinde çakışıyor mu ve constant_price true ise prices sadece 1 tane olmalı
      if (constant_price) {
        if (prices.length > 1) {
          return res.status(400).send({
            success: false,
            message: req.t("HOTEL_ROOM_PACKAGE.PRICE_COUNT_ERROR"),
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
          message: req.t("HOTEL_ROOM_PACKAGE.DATE_RANGE_ERROR"),
        });
      }
      const packageModel = await new VisaPackageModel().create({
        visa_id,
        discount,
        total_tax_amount,
        constant_price,
        return_acceptance_period,
      });

      const translateResult = await translateCreate({
        target: "visa_package_pivots",
        target_id_key: "visa_package_id",
        target_id: packageModel.id,
        language_code: (req as any).language,
        data: {
          name,
          description,
          refund_policy,
        },
      });

      let pricesModel = [];
      for (const price of prices) {
        const priceModel = await new VisaPackagePriceModel().create({
          visa_package_id: packageModel.id,
          main_price: price.main_price,
          child_price: price.child_price,
          currency_id: price.currency_id,
          start_date: price.start_date,
          end_date: price.end_date,
        });
        pricesModel.push(priceModel);
      }

      packageModel.prices = pricesModel;
      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE.CREATED_SUCCESS"),
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

  async findOnePackage(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const packageModel = await knex
        .select(
          "visa_packages.*",
          knex.raw("json_agg(visa_package_prices.*) as prices")
        )
        .from("visa_packages")
        .leftJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .where("visa_packages.id", id)
        .whereNull("visa_package_prices.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .groupBy("visa_packages.id")
        .first();

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE.NOT_FOUND"),
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

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: number };
      const {
        visa_id,
        discount,
        total_tax_amount,
        constant_price,
        return_acceptance_period,
        prices,
      } = req.body as CreatePackageBody;

      const packageModel = await knex
        .select(
          "visa_packages.*",
          knex.raw("json_agg(visa_package_prices.*) as prices")
        )
        .from("visa_packages")
        .leftJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .where("visa_packages.id", id)
        .whereNull("visa_package_prices.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .groupBy("visa_packages.id")
        .first();

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE.NOT_FOUND"),
        });
      }

      // constant_price true ise prices sadece 1 tane olmalı
      if (constant_price) {
        if (prices.length > 1) {
          return res.status(400).send({
            success: false,
            message: req.t("HOTEL_ROOM_PACKAGE.PRICE_COUNT_ERROR"),
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
          message: req.t("HOTEL_ROOM_PACKAGE.DATE_RANGE_ERROR"),
        });
      }

      // Update package
      await knex("visa_packages")
        .update({
          visa_id,
          discount,
          total_tax_amount,
          constant_price,
          return_acceptance_period,
        })
        .where("id", id)
        .whereNull("deleted_at");

      // Delete old prices
      await knex("visa_package_prices")
        .del()
        .where("visa_package_id", id)
        .whereNull("deleted_at");

      // Create new prices
      let pricesModel = [];
      for (const price of prices) {
        const priceModel = await new VisaPackagePriceModel().create({
          visa_package_id: id,
          main_price: price.main_price,
          child_price: price.child_price,
          currency_id: price.currency_id,
          start_date: price.start_date,
          end_date: price.end_date,
        });
        pricesModel.push(priceModel);
      }

      // Get updated package with prices
      const updatedPackage = await knex
        .select(
          "visa_packages.*",
          knex.raw("json_agg(visa_package_prices.*) as prices")
        )
        .from("visa_packages")
        .leftJoin(
          "visa_package_prices",
          "visa_packages.id",
          "visa_package_prices.visa_package_id"
        )
        .where("visa_packages.id", id)
        .whereNull("visa_package_prices.deleted_at")
        .whereNull("visa_packages.deleted_at")
        .groupBy("visa_packages.id")
        .first();

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE.UPDATED_SUCCESS"),
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

      const existingPackage = await new VisaPackageModel().exists({
        id,
      });

      if (!existingPackage) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE.NOT_FOUND"),
        });
      }

      await knex.transaction(async (trx) => {
        await trx
          .update({
            deleted_at: new Date(),
          })
          .from("visa_packages")
          .where("visa_packages.id", id);

        await trx
          .update({
            deleted_at: new Date(),
          })
          .from("visa_package_prices")
          .where("visa_package_id", id);
      });

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE.DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("GENERAL.ERROR"),
      });
    }
  }
}
