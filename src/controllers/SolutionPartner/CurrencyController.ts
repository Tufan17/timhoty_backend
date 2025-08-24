import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";
import CurrencyModel from "@/models/CurrencyModel";
import CurrencyPivotModel from "@/models/CurrencyPivotModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class CurrencyController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {

      const language = req.language;

      const query = knex("currencies")
        .whereNull("currencies.deleted_at")
        .innerJoin(
          "currency_pivots",
          "currencies.id",
          "currency_pivots.currency_id"
        )
        .where("currency_pivots.language_code", language)
        .select("currencies.*", "currency_pivots.name as name")
        .groupBy("currencies.id", "currency_pivots.name");
  const data = await query
        .clone()
        .orderBy("currencies.created_at", "asc")

      return res.status(200).send({
        success: true,
        message: req.t("CURRENCY.CURRENCY_FETCHED_SUCCESS"),
        data: data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CURRENCY.CURRENCY_FETCHED_ERROR"),
      });
    }
  }


}
