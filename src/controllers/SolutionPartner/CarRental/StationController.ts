import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import CityModel from "@/models/CityModel";
import StationModel from "@/models/StationModel";
import { translateCreate, translateUpdate } from "@/helper/translate";

export default class StationController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        location_id,
        status,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        location_id?: string;
        status?: boolean;
      };

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;

      // Ortak JOIN'ler
      const base = knex("stations")
        .where("stations.solution_partner_id", solutionPartnerUser.solution_partner_id)
        .whereNull("stations.deleted_at")
        .innerJoin("cities", "stations.location_id", "cities.id")
        .innerJoin("station_pivots", "stations.id", "station_pivots.station_id")
        .where("station_pivots.language_code", language)
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("city_pivots.language_code", language)
        .innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
        .where("country_pivots.language_code", language)
        .select(
          knex.raw("CONCAT(city_pivots.name, ', ', country_pivots.name) as address")
        )
        .modify((qb) => {
          if (typeof status !== "undefined")
            qb.where("stations.status", status);
          if (location_id) qb.where("stations.location_id", location_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("stations.map_location", "ilike", like);
            });

            // "true"/"false" metni status filtresine eşlensin (opsiyonel)
            const sv = search.toLowerCase();
            if (sv === "true" || sv === "false") {
              qb.orWhere("stations.status", sv === "true");
            }
          }
        });

      // Toplam sayım (benzersiz araç kiralama)
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("stations.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Veri seçimi
      const data = await base
        .clone()
        .distinct("stations.id") // aynı araç kiralama birden fazla pivot kaydına düşmesin
        .select("stations.*", "station_pivots.name", "city_pivots.name as city_name", "country_pivots.name as country_name")
        .orderBy("stations.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("STATION.STATION_FETCHED_SUCCESS"),
        data: data,
        recordsPerPageOptions: [10, 20, 50, 100],
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("STATION.STATION_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const stations = await knex("stations").whereNull("stations.deleted_at");
      return res.status(200).send({
        success: true,
        message: req.t("STATION.STATION_FETCHED_SUCCESS"),
        data: stations,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("STATION.STATION_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const station = await knex("stations")
        .whereNull("stations.deleted_at")
        .innerJoin("station_pivots", "stations.id", "station_pivots.station_id")
        .where("station_pivots.language_code", language)
        .innerJoin("cities", "stations.location_id", "cities.id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id") 
        .where("city_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .where("stations.id", id)
        .select("stations.*", "station_pivots.name as name", "city_pivots.name as city_name", "country_pivots.name as country_name", "cities.country_id")
        .first();

      if (!station) {
        return res.status(404).send({
          success: false,
          message: req.t("STATION.STATION_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("STATION.STATION_FETCHED_SUCCESS"),
        data: station,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("STATION.STATION_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      // Get the authenticated solution partner from the request
      const solutionPartnerUser = (req as any).user;
      const { location_id, map_location, name } = req.body as {
        location_id: string;
        map_location: string;
        name: string;
      };



      // Validate location_id
      if (location_id) {
        const existingCity = await new CityModel().first({
          "cities.id": location_id,
        });

        if (!existingCity) {
          return res.status(400).send({
            success: false,
            message: req.t("CITY.CITY_NOT_FOUND"),
          });
        }
      }

      const station = await new StationModel().create({
        location_id,
        map_location,
        status: false,
        solution_partner_id: solutionPartnerUser.solution_partner_id,
      });

      const translateResult = await translateCreate({
        target: "station_pivots",
        target_id_key: "station_id",
        target_id: station.id,
        language_code: req.language,
        data: {
          name,
        },
      });
      station.station_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("STATION.STATION_CREATED_SUCCESS"),
        data: station,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("STATION.STATION_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { location_id, map_location, name } = req.body as {
        location_id?: string;
        map_location?: string;
        name?: string;
      };

      const solutionPartnerUser = (req as any).user;

      const existingStation = await new StationModel().first({ id, solution_partner_id: solutionPartnerUser.solution_partner_id });

      if (!existingStation) {
        return res.status(404).send({
          success: false,
          message: req.t("STATION.STATION_NOT_FOUND"),
        });
      }

      // Validate location_id if provided
      if (location_id) {
        const existingCity = await new CityModel().first({
          "cities.id": location_id,
        });

        if (!existingCity) {
          return res.status(400).send({
            success: false,
            message: req.t("CITY.CITY_NOT_FOUND"),
          });
        }
      }

      let body: any = {
        location_id:
          location_id !== undefined ? location_id : existingStation.location_id,
        status: false,
        map_location:
          map_location !== undefined
            ? map_location
            : existingStation.map_location,
      };

      await new StationModel().update(id, body);

      // Update translations if provided
      if (name) {
        await translateUpdate({
          target: "station_pivots",
          target_id_key: "station_id",
          target_id: id,
          data: {
            ...(name && { name }),
          },
          language_code: req.language,
        });
      }

      const updatedStation = await new StationModel().oneToMany(
        id,
        "station_pivots",
        "station_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("STATION.STATION_UPDATED_SUCCESS"),
        data: updatedStation,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("STATION.STATION_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const solutionPartnerUser = (req as any).user;
      const existingStation = await new StationModel().first({ id, solution_partner_id: solutionPartnerUser.solution_partner_id });
      if (!existingStation) {
        return res.status(404).send({
          success: false,
          message: req.t("STATION.STATION_NOT_FOUND"),
        });
      }
      await new StationModel().delete(id);
    return res.status(200).send({
      success: true,
      message: req.t("STATION.STATION_DELETED_SUCCESS"),
    });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("STATION.STATION_DELETED_ERROR"),
      });
    }
  }
}
