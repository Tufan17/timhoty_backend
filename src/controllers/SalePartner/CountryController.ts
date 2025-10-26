import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";

export default class CountryController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = req.language;
      const countries = await knex("countries")
        .whereNull("countries.deleted_at")
        .select("countries.*", "country_pivots.name as name")
        .innerJoin("country_pivots", "countries.id", "country_pivots.country_id")
        .where("country_pivots.language_code", language);
      
      return res.status(200).send({
        success: true,
        message: req.t("COUNTRY.COUNTRY_FETCHED_SUCCESS"),
        data: countries as any,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("COUNTRY.COUNTRY_FETCHED_ERROR"),
      });
    }
  }
}
