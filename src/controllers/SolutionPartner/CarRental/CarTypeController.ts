import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import CarTypeModel from "@/models/CarTypeModel";

export default class CarTypeController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = req.language || "en";
      const carTypes = await knex("car_types")
        .whereNull("car_types.deleted_at")
        .innerJoin(
          "car_type_pivots",
          "car_types.id",
          "car_type_pivots.car_type_id"
        )
        .where("car_type_pivots.language_code", language)
        .select("car_types.id as id", "car_type_pivots.name as name");
      return res.status(200).send({
        success: true,
        message: req.t("CAR_TYPE.CAR_TYPE_FETCHED_SUCCESS"),
        data: carTypes,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_TYPE.CAR_TYPE_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = req.language || "en";
      const carType = await new CarTypeModel().getPivot(id, language);

      return res.status(200).send({
        success: true,
        message: req.t("CAR_TYPE.CAR_TYPE_FETCHED_SUCCESS"),
        data: carType,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("CAR_TYPE.CAR_TYPE_FETCHED_ERROR"),
      });
    }
  }
}
