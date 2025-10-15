import { FastifyRequest, FastifyReply } from "fastify";
import TourPackagePriceModel from "@/models/TourPackagePriceModel";
import TourPackageModel from "@/models/TourPackageModel";
import knex from "@/db/knex";

export default class TourPackagePriceController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tour_package_id } = req.query as { tour_package_id?: string };
      
      let prices;
      if (tour_package_id) {
        prices = await new TourPackagePriceModel().getPricesByTourPackageId(tour_package_id);
      } else {
        prices = await new TourPackagePriceModel().getAll();
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_PRICE.PRICES_FETCHED_SUCCESS"),
        data: prices,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_PRICE.PRICES_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const price = await new TourPackagePriceModel().findId(id);

      if (!price) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_PRICE.PRICE_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_FETCHED_SUCCESS"),
        data: price,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        tour_package_id,
        main_price,
        child_price,
        baby_price,
        currency_id,
        period,
        date,
        // quota,
        discount,
        total_tax_amount,
        single,
      } = req.body as {
        tour_package_id: string;
        main_price: number;
        child_price?: number;
        baby_price?: number;
        currency_id: string;
        period?: string;
        date?: string;
        // quota?: number;
        discount?: number;
        total_tax_amount?: number;
        single?: number;
      };

      // Validate tour package exists
      const existingTourPackage = await new TourPackageModel().exists({
        id: tour_package_id,
      });

      if (!existingTourPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE.NOT_FOUND"),
        });
      }

      // Check if price for the same date already exists
      if (date) {
        const existingPrice = await knex("tour_package_prices")
          .where("tour_package_id", tour_package_id)
          .where("date", date)
          .whereNull("deleted_at")
          .first();

        if (existingPrice) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR_PACKAGE_PRICE.DATE_ALREADY_EXISTS"),
          });
        }
      }

      // Create tour package price
      const price = await new TourPackagePriceModel().create({
        tour_package_id,
        main_price,
        child_price,
        baby_price,
        currency_id,
        period,
        date,
        // quota,
        discount,
        total_tax_amount,
        single,
      });

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_CREATED_SUCCESS"),
        data: price,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const {
        main_price,
        child_price,
        baby_price,
        currency_id,
        period,
        date,
        // quota,
        discount,
        total_tax_amount,
        single,
      } = req.body as {
        main_price?: number;
        child_price?: number;
        baby_price?: number;
        currency_id?: string;
        period?: string;
        date?: string;
        // quota?: number;
        discount?: number;
        total_tax_amount?: number;
        single?: number;
      };

      const existingPrice = await new TourPackagePriceModel().findId(id);
      if (!existingPrice) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_PRICE.PRICE_NOT_FOUND"),
        });
      }

      // Check if price for the same date already exists (excluding current record)
      if (date) {
        const duplicatePrice = await knex("tour_package_prices")
          .where("tour_package_id", existingPrice.tour_package_id)
          .where("date", date)
          .whereNot("id", id)
          .whereNull("deleted_at")
          .first();

        if (duplicatePrice) {
          return res.status(400).send({
            success: false,
            message: req.t("TOUR_PACKAGE_PRICE.DATE_ALREADY_EXISTS"),
          });
        }
      }

      const updatedPrice = await new TourPackagePriceModel().update(id, {
        main_price,
        child_price,
        baby_price,
        currency_id,
        discount,
        total_tax_amount,
        period,
        date,
        // quota,
        single,
      });

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_UPDATED_SUCCESS"),
        data: updatedPrice,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingPrice = await new TourPackagePriceModel().findId(id);

      if (!existingPrice) {
        return res.status(404).send({
          success: false,
          message: req.t("TOUR_PACKAGE_PRICE.PRICE_NOT_FOUND"),
        });
      }

      await new TourPackagePriceModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_PRICE.PRICE_DELETED_ERROR"),
      });
    }
  }

  async deleteByTourPackageId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { tour_package_id } = req.params as { tour_package_id: string };

      // Validate tour package exists
      const existingTourPackage = await new TourPackageModel().findId(tour_package_id);
      if (!existingTourPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("TOUR_PACKAGE.NOT_FOUND"),
        });
      }

      await new TourPackagePriceModel().deleteByTourPackageId(tour_package_id);

      return res.status(200).send({
        success: true,
        message: req.t("TOUR_PACKAGE_PRICE.PRICES_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("TOUR_PACKAGE_PRICE.PRICES_DELETED_ERROR"),
      });
    }
  }
}

