import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import TourModel from "@/models/TourModel";
import TourDeparturePointModel from "@/models/TourDeparturePointModel";
import CityModel from "@/models/CityModel";

export default class TourDeparturePointController {
 
    async dataTable(req: FastifyRequest, res: FastifyReply) {
        try {
          const {
            page = 1,
            limit = 10,
            search = "",
            tour_id,
          } = req.query as {
            page: number;
            limit: number;
            search: string;
            tour_id?: string;
          };
    
          const language = (req as any).language;
          const solutionPartnerUser = (req as any).user;
          const spFromUser = solutionPartnerUser?.solution_partner_id;
    
          // Base query with JOINs
            const base = knex("tour_departure_points")
            .whereNull("tour_departure_points.deleted_at")
            .innerJoin("cities", "tour_departure_points.location_id", "cities.id")
            .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
            .innerJoin("tours", "tour_departure_points.tour_id", "tours.id")
            .where("city_pivots.language_code", language)
            .whereNull("city_pivots.deleted_at")
            .whereNull("tours.deleted_at")
            .modify((qb) => {
              // Filter by solution partner from authenticated user
              if (spFromUser) qb.where("tours.solution_partner_id", spFromUser);
    
              if (tour_id) qb.where("tour_departure_points.tour_id", tour_id);
    
              if (search) {
                const like = `%${search}%`;
                qb.andWhere((w) => {
                  w.where("city_pivots.name", "ilike", like);
                });
              }
            });
    
          // Count total records
          const countRow = await base
            .clone()
            .clearSelect()
            .clearOrder()
            .countDistinct<{ total: string }>("tour_departure_points.id as total")
            .first();
    
          const total = Number(countRow?.total ?? 0);
          const totalPages = Math.ceil(total / Number(limit));
    
          // Get data
          const data = await base
            .clone()
            .distinct("tour_departure_points.id")
            .select(
              "tour_departure_points.*",
              "city_pivots.name as city_name",
              "tours.location_id"
            )
            .orderBy("tour_departure_points.created_at", "desc")
            .limit(Number(limit))
            .offset((Number(page) - 1) * Number(limit));
    
          return res.status(200).send({
            success: true,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_FETCHED_SUCCESS"),
            data,
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
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_FETCHED_ERROR"),
          });
        }
      }
    
      async findAll(req: FastifyRequest, res: FastifyReply) {
        try {
          const language = (req as any).language;
          const { tour_id } = req.query as { tour_id?: string };
    
          let query = knex("tour_departure_points")
            .whereNull("tour_departure_points.deleted_at")
            .select("tour_departure_points.*", "city_pivots.name as city_name")
            .innerJoin("cities", "tour_departure_points.location_id", "cities.id")
            .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
            .where("city_pivots.language_code", language)
            .whereNull("city_pivots.deleted_at");
    
          if (tour_id) {
            query = query.where("tour_departure_points.tour_id", tour_id);
          }
    
          const tourDeparturePoints = await query;
    
          return res.status(200).send({
            success: true,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_FETCHED_SUCCESS"),
            data: tourDeparturePoints,
          });
        } catch (error) {
          console.log(error);
          return res.status(500).send({
            success: false,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_FETCHED_ERROR"),
          });
        }
      }
    
      async findOne(req: FastifyRequest, res: FastifyReply) {
        try {
          const { id } = req.params as { id: string };
          const language = (req as any).language;
    
        const tourDeparturePoint = await knex("tour_departure_points")
            .whereNull("tour_departure_points.deleted_at")
            .where("tour_departure_points.id", id)
            .select("tour_departure_points.*", "city_pivots.name as city_name")
            .innerJoin("cities", "tour_departure_points.location_id", "cities.id")
            .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
            .where("city_pivots.language_code", language)
            .whereNull("city_pivots.deleted_at")
            .first();
    
        if (!tourDeparturePoint) {
            return res.status(404).send({
              success: false,
              message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_NOT_FOUND"),
            });
          }
    
          return res.status(200).send({
            success: true,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_FETCHED_SUCCESS"),
            data: tourDeparturePoint,
          });
        } catch (error) {
          console.log(error);
          return res.status(500).send({
            success: false,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_FETCHED_ERROR"),
          });
        }
      }
    
      async create(req: FastifyRequest, res: FastifyReply) {
        try {
          const { tour_id, location_id } = req.body as {
            tour_id: string;
            location_id: string;
          };
    
          const existTour = await new TourModel().findId(tour_id);
          if (!existTour) {
            return res.status(400).send({
              success: false,
              message: req.t("TOUR.TOUR_NOT_FOUND"),
            });
          }
    
          const existLocation = await new TourDeparturePointModel().first({tour_id, location_id});
          if (existLocation) {
            return res.status(400).send({
              success: false,
              message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_ALREADY_EXISTS"),
            });
          }
    
          // Create tour location
          const tourDeparturePoint = await new TourDeparturePointModel().create({
            tour_id,
            location_id,
          });
    
          return res.status(200).send({
            success: true,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_CREATED_SUCCESS"),
            data: tourDeparturePoint,
          });
        } catch (error) {
          console.log(error);
          return res.status(500).send({
            success: false,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_CREATED_ERROR"),
          });
        }
      }
    
      async update(req: FastifyRequest, res: FastifyReply) {
        try {
          const { id } = req.params as { id: string };
          const { tour_id, location_id } = req.body as {
            tour_id?: string;
            location_id?: string;
          };
    
          const existingTourLocation = await new TourDeparturePointModel().first({ id });
    
          if (!existingTourLocation) {
            return res.status(404).send({
              success: false,
              message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_NOT_FOUND"),
            });
          }
    
          // Validate tour_id if provided
          if (tour_id) {
            const existingTour = await new TourModel().first({
              "tours.id": tour_id,
            });
    
            if (!existingTour) {
              return res.status(400).send({
                success: false,
                message: req.t("TOUR.TOUR_NOT_FOUND"),
              });
            }
          }
    
          // Update tour location if tour_id or location_id is provided
          if (tour_id || location_id !== undefined) {
            await new TourDeparturePointModel().update(id, {
              ...(tour_id && { tour_id }),
              ...(location_id !== undefined && { location_id }),
            });
          }
    
          return res.status(200).send({
            success: true,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_UPDATED_SUCCESS"),
            data: existingTourLocation,
          });
        } catch (error) {
          console.log(error);
          return res.status(500).send({
            success: false,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_UPDATED_ERROR"),
          });
        }
      }
    
      async delete(req: FastifyRequest, res: FastifyReply) {
        try {
          const { id } = req.params as { id: string };
          const existingTourLocation = await new TourDeparturePointModel().first({ id });
    
          if (!existingTourLocation) {
            return res.status(404).send({
              success: false,
              message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_NOT_FOUND"),
            });
          }
    
          await new TourDeparturePointModel().delete(id);
    
          return res.status(200).send({
            success: true,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_DELETED_SUCCESS"),
          });
        } catch (error) {
          console.log(error);
          return res.status(500).send({
            success: false,
            message: req.t("TOUR_DEPARTURE_POINT.TOUR_DEPARTURE_POINT_DELETED_ERROR"),
          });
        }
      }
}
