import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import CurrencyModel from "@/models/CurrencyModel";
import CurrencyPivotModel from "@/models/CurrencyPivotModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class CurrencyController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("currencies")
        .whereNull("currencies.deleted_at")
        .innerJoin("currency_pivots", "currencies.id", "currency_pivots.currency_id")
        .where("currency_pivots.language_code", language)
        .where(function () {
          this.where("currency_pivots.name", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere("currencies.is_active", search.toLowerCase() === "true");
          }
        })
        .select("currencies.*", "currency_pivots.name as name")
        .groupBy("currencies.id", "currency_pivots.name");
        
      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("currencies.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("CURRENCY.CURRENCY_FETCHED_SUCCESS"),
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
        message: req.t("CURRENCY.CURRENCY_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const currency = await new CurrencyModel().oneToMany(id, "currency_pivots", "currency_id");
      
      return res.status(200).send({
        success: true,
        message: req.t("CURRENCY.CURRENCY_FETCHED_SUCCESS"),
        data: currency,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CURRENCY.CURRENCY_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, code, symbol, position, is_active } = req.body as {
        name: string;
        code: string;
        symbol: string;
        position: string;
        is_active: boolean;
      };

      const existingCurrency = await new CurrencyModel().first({ code });

      if (existingCurrency) {
        return res.status(400).send({
          success: false,
          message: req.t("CURRENCY.CURRENCY_ALREADY_EXISTS"),
        });
      }
      const currency = await new CurrencyModel().create({
        code,
        symbol,
        position,
        is_active,
      });
      const translateResult = await translateCreate({
        target: "currency_pivots",
        target_id_key: "currency_id",
        target_id: currency.id,
        data: {
          name,
        },
      });
      currency.currency_pivots = translateResult;


      return res.status(200).send({
        success: true,
        message: req.t("CURRENCY.CURRENCY_CREATED_SUCCESS"),
        data: currency,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CURRENCY.CURRENCY_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name, code, symbol, position, is_active } = req.body as {
        name: string;
        code: string;
        symbol: string;
        position: string;
        is_active: boolean;
      };

      const existingCurrency = await new CurrencyModel().first({ id });

      if (!existingCurrency) {
        return res.status(404).send({
          success: false,
          message: req.t("CURRENCY.CURRENCY_NOT_FOUND"),
        });
      }

      let body: any = {
        code: code || existingCurrency.code,
        symbol: symbol || existingCurrency.symbol,
        position: position || existingCurrency.position,
        is_active ,
      };

      await new CurrencyModel().update(id, body);
      await translateUpdate({
        target: "currency_pivots",
        target_id_key: "currency_id",
        target_id: id,
        data: {
          name,
        },
      });
      const updatedCurrency = await new CurrencyModel().oneToMany(id, "currency_pivots", "currency_id");

      return res.status(200).send({
        success: true,
        message: req.t("CURRENCY.CURRENCY_UPDATED_SUCCESS"),
        data: updatedCurrency,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CURRENCY.CURRENCY_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingCurrency = await new CurrencyModel().first({ id });

      if (!existingCurrency) {
        return res.status(404).send({
          success: false,
          message: req.t("CURRENCY.CURRENCY_NOT_FOUND"),
        });
      }

      await new CurrencyModel().delete(id);
      await knex("currency_pivots").where("currency_id", id).whereNull("deleted_at").update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("CURRENCY.CURRENCY_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CURRENCY.CURRENCY_DELETED_ERROR"),
      });
    }
  }
}
