import { FastifyReply, FastifyRequest } from "fastify";
import HotelRoomPackageModel from "@/models/HotelRoomPackageModel";
import HotelRoomPackagePriceModel from "@/models/HotelRoomPackagePriceModel";
import knex from "@/db/knex";

interface CreatePackageBody {
  hotel_room_id: string;
  discount?: number;
  total_tax_amount?: number;
  constant_price: boolean;
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

export class HotelRoomPackageController {
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
            this.where(function() {
              // Add searchable fields here
              this.where("hotel_room_packages.discount", "ilike", like)
                .orWhere("hotel_room_packages.total_tax_amount", "ilike", like);
              
              // Handle boolean search for constant_price
              if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
                this.orWhere("hotel_room_packages.constant_price", search.toLowerCase() === "true");
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
      const { hotel_room_id } = req.params as { hotel_room_id: string };
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
          "hotel_room_packages.*",
          knex.raw("COALESCE(json_agg(hotel_room_package_prices.*) FILTER (WHERE hotel_room_package_prices.id IS NOT NULL), '[]'::json) as prices")
        )
        .from("hotel_room_packages")
        .leftJoin(
          "hotel_room_package_prices",
          "hotel_room_packages.id",
          "hotel_room_package_prices.hotel_room_package_id"
        )
        .where("hotel_room_packages.id", id)
        .whereNull("hotel_room_package_prices.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .groupBy("hotel_room_packages.id")
        .first();

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_PACKAGE.NOT_FOUND"),
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
        hotel_room_id,
        discount,
        total_tax_amount,
        constant_price,
        prices,
      } = req.body as CreatePackageBody;


      const existingHotelRoom = await new HotelRoomPackageModel().exists({
         hotel_room_id,
      });

      if (existingHotelRoom) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_ROOM_PACKAGE.HOTEL_ROOM_PACKAGE_ALREADY_EXISTS"),
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
      const packageModel = await new HotelRoomPackageModel().create({
        hotel_room_id,
        discount,
        total_tax_amount,
        constant_price,
      });
      let pricesModel = [];
      for (const price of prices) {
        const priceModel = await new HotelRoomPackagePriceModel().create({
          hotel_room_package_id: packageModel.id,
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
        message: req.t("HOTEL_ROOM_PACKAGE.CREATED_SUCCESS"),
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
          "hotel_room_packages.*",
          knex.raw("json_agg(hotel_room_package_prices.*) as prices")
        )
        .from("hotel_room_packages")
        .leftJoin(
          "hotel_room_package_prices",
          "hotel_room_packages.id",
          "hotel_room_package_prices.hotel_room_package_id"
        )
        .where("hotel_room_packages.id", id)
        .whereNull("hotel_room_package_prices.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .groupBy("hotel_room_packages.id")
        .first();

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_PACKAGE.NOT_FOUND"),
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
        hotel_room_id,
        discount,
        total_tax_amount,
        constant_price,
        prices,
      } = req.body as CreatePackageBody;

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
        .where("hotel_room_packages.id", id)
        .whereNull("hotel_room_package_prices.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .groupBy("hotel_room_packages.id")
        .first();

      if (!packageModel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_PACKAGE.NOT_FOUND"),
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
      await knex("hotel_room_packages")
        .update({
          hotel_room_id,
          discount,
          total_tax_amount,
          constant_price,
        })
        .where("id", id)
        .whereNull("deleted_at");

      // Delete old prices
      await knex("hotel_room_package_prices")
        .del()
        .where("hotel_room_package_id", id)
        .whereNull("deleted_at");

      // Create new prices
      let pricesModel = [];
      for (const price of prices) {
        const priceModel = await new HotelRoomPackagePriceModel().create({
          hotel_room_package_id: id,
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
          "hotel_room_packages.*",
          knex.raw("json_agg(hotel_room_package_prices.*) as prices")
        )
        .from("hotel_room_packages")
        .leftJoin(
          "hotel_room_package_prices",
          "hotel_room_packages.id",
          "hotel_room_package_prices.hotel_room_package_id"
        )
        .where("hotel_room_packages.id", id)
        .whereNull("hotel_room_package_prices.deleted_at")
        .whereNull("hotel_room_packages.deleted_at")
        .groupBy("hotel_room_packages.id")
        .first();

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_PACKAGE.UPDATED_SUCCESS"),
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

      const existingPackage = await new HotelRoomPackageModel().exists({
        id,
      });

      if (!existingPackage) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM_PACKAGE.NOT_FOUND"),
        });
      }

      await knex.transaction(async (trx) => {
        await trx
        .update({
            deleted_at: new Date(),
          })
          .from("hotel_room_packages")
          .where("hotel_room_packages.id", id);

        await trx
          .update({
            deleted_at: new Date(),
          })
          .from("hotel_room_package_prices")
          .where("hotel_room_package_id", id);
      });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM_PACKAGE.DELETED_SUCCESS"),
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
