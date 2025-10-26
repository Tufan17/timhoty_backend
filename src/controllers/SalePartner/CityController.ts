import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../db/knex";

export default class CityController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { country_id = "" } = req.query as { country_id: string };
      const language = req.language || "en";
      const cities = await knex("cities")
        .whereNull("cities.deleted_at")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("city_pivots.language_code", language)
        .where(function () {
          if (country_id) {
            this.where("cities.country_id", country_id);
          }
        })
        .select("cities.id as id", "city_pivots.name as name");
      
      return res.status(200).send({
        success: true,
        message: req.t("CITY.CITY_FETCHED_SUCCESS"),
        data: cities,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CITY.CITY_FETCHED_ERROR"),
      });
    }
  }
}
