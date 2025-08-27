import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";
import GearTypeModel from "@/models/GearTypeModel";

export default class GearTypeController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = req.language || "en";
      const gearTypes = await knex("gear_types")
        .whereNull("gear_types.deleted_at")
        .innerJoin(
          "gear_type_pivots",
          "gear_types.id",
          "gear_type_pivots.gear_type_id"
        )
        .where("gear_type_pivots.language_code", language)
        .select("gear_types.id as id", "gear_type_pivots.name as name");
      return res.status(200).send({
        success: true,
        message: req.t("GEAR_TYPE.GEAR_TYPE_FETCHED_SUCCESS"),
        data: gearTypes,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("GEAR_TYPE.GEAR_TYPE_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = req.language || "en";
      const gearType = await new GearTypeModel().getPivot(id, language);

      return res.status(200).send({
        success: true,
        message: req.t("GEAR_TYPE.GEAR_TYPE_FETCHED_SUCCESS"),
        data: gearType,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("GEAR_TYPE.GEAR_TYPE_FETCHED_ERROR"),
      });
    }
  }
}
