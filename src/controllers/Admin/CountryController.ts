import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import CountryModel from "@/models/CountryModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import CurrencyModel from "@/models/CurrencyModel";

export default class CountryController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
      } = req.query as { page: number; limit: number; search: string };

      const language = req.language;

      const query = knex("countries")
        .whereNull("countries.deleted_at")
        .innerJoin(
          "country_pivots",
          "countries.id",
          "country_pivots.country_id"
        )
        .where("country_pivots.language_code", language)
        .where(function () {
          this.where("country_pivots.name", "ilike", `%${search}%`);
          if (
            search.toLowerCase() === "true" ||
            search.toLowerCase() === "false"
          ) {
            this.orWhere(
              "countries.is_active",
              search.toLowerCase() === "true"
            );
          }
        })
        .select("countries.*", "country_pivots.name as name")
        .groupBy("countries.id", "country_pivots.name");

      const countResult = await query.clone().count("* as total").first();
      const total = Number(countResult?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));
      const data = await query
        .clone()
        .orderBy("countries.created_at", "asc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("COUNTRY.COUNTRY_FETCHED_SUCCESS"),
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
        message: req.t("COUNTRY.COUNTRY_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const country = await knex("countries")
        .where("countries.id", id)
        .whereNull("countries.deleted_at")
        .innerJoin(
          "country_pivots", 
          "countries.id",
          "country_pivots.country_id"
        )
        .where("country_pivots.language_code", req.language)
        .select(
          "countries.*",
          "country_pivots.name as name",
        )
        .first();

      if (!country) {
        return res.status(404).send({
          success: false,
          message: req.t("COUNTRY.COUNTRY_NOT_FOUND"),
        });
      }

      const currency = await knex("currencies")
        .where("currencies.id", country.currency_id)
        .leftJoin("currency_pivots", "currencies.id", "currency_pivots.currency_id")
        .where("currency_pivots.language_code", req.language)
        .whereNull("currencies.deleted_at")
        .first();
      if (currency) {
        country.currency = currency;
      }

      return res.status(200).send({
        success: true,
        message: req.t("COUNTRY.COUNTRY_FETCHED_SUCCESS"),
        data: country,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("COUNTRY.COUNTRY_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { name, phone_code, timezone, flag, code, currency_id } =
        req.body as {
          name: string;
          phone_code: string;
          timezone: string;
          flag: string;
          code: string;
          currency_id: string;
        };

      const existingCountry = await new CountryModel().first({ code });

      if (existingCountry) {
        return res.status(400).send({
          success: false,
          message: req.t("COUNTRY.COUNTRY_ALREADY_EXISTS"),
        });
      }

      if (currency_id) {
        const existingCurrency = await new CurrencyModel().first({
          "currencies.id": currency_id,
        });

        if (!existingCurrency) {
          return res.status(400).send({
            success: false,
            message: req.t("CURRENCY.CURRENCY_NOT_FOUND"),
          });
        }
      }

      const country = await new CountryModel().create({
        code,
        phone_code,
        timezone,
        flag,
        currency_id,
      });
      const translateResult = await translateCreate({
        target: "country_pivots",
        target_id_key: "country_id",
        target_id: country.id,
        language_code: req.language,
        data: {
          name,
        },
      });
      
      country.country_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("COUNTRY.COUNTRY_CREATED_SUCCESS"),
        data: country,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("COUNTRY.COUNTRY_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { name, phone_code, timezone, flag, code, currency_id } =
        req.body as {
          name: string;
          phone_code: string;
          timezone: string;
          flag: string;
          code: string;
          currency_id: string;
        };

      const existingCountry = await new CountryModel().first({ id });

      if (!existingCountry) {
        return res.status(404).send({
          success: false,
          message: req.t("COUNTRY.COUNTRY_NOT_FOUND"),
        });
      }

      let body: any = {
        code: code || existingCountry.code,
        phone_code: phone_code || existingCountry.phone_code,
        timezone: timezone || existingCountry.timezone,
        flag: flag || existingCountry.flag,
        currency_id: currency_id || existingCountry.currency_id,
      };

      await new CountryModel().update(id, body);
      await translateUpdate({
        target: "country_pivots",
        target_id_key: "country_id",
        target_id: id,
        data: {
          name,
        },
        language_code: req.language,
      });
      const updatedCountry = await new CountryModel().oneToMany(
        id,
        "country_pivots",
        "country_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("COUNTRY.COUNTRY_UPDATED_SUCCESS"),
        data: updatedCountry,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("COUNTRY.COUNTRY_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingCountry = await new CountryModel().first({ id });

      if (!existingCountry) {
        return res.status(404).send({
          success: false,
          message: req.t("COUNTRY.COUNTRY_NOT_FOUND"),
        });
      }

      await new CountryModel().delete(id);
      await knex("country_pivots")
        .where("country_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });
      await knex("cities")
        .where("country_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });
      return res.status(200).send({
        success: true,
        message: req.t("COUNTRY.COUNTRY_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("COUNTRY.COUNTRY_DELETED_ERROR"),
      });
    }
  }
}
