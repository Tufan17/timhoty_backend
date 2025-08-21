import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import HotelOpportunityModel from "@/models/HotelOpportunityModel";
import HotelOpportunityPivotModel from "@/models/HotelOpportunityPivotModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import HotelModel from "@/models/HotelModel";

export default class HotelOpportunityController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        hotel_id,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        hotel_id?: string;
      };

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;

      // Base query with JOINs
      const base = knex("hotel_opportunities")
        .whereNull("hotel_opportunities.deleted_at")
        .innerJoin("hotel_opportunity_pivots", "hotel_opportunities.id", "hotel_opportunity_pivots.hotel_opportunity_id")
        .innerJoin("hotels", "hotel_opportunities.hotel_id", "hotels.id")
        .where("hotel_opportunity_pivots.language_code", language)
        .whereNull("hotel_opportunity_pivots.deleted_at")
        .whereNull("hotels.deleted_at")
        .modify((qb) => {
          // Filter by solution partner from authenticated user
          if (spFromUser) qb.where("hotels.solution_partner_id", spFromUser);

          if (hotel_id) qb.where("hotel_opportunities.hotel_id", hotel_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_opportunity_pivots.category", "ilike", like)
                .orWhere("hotel_opportunity_pivots.description", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("hotel_opportunities.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("hotel_opportunities.id")
        .select(
          "hotel_opportunities.*",
          "hotel_opportunity_pivots.category",
          "hotel_opportunity_pivots.description",
          "hotels.location_id"
        )
        .orderBy("hotel_opportunities.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_FETCHED_SUCCESS"),
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
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { hotel_id } = req.query as { hotel_id?: string };

      let query = knex("hotel_opportunities")
        .whereNull("hotel_opportunities.deleted_at")
        .select(
          "hotel_opportunities.*", 
          "hotel_opportunity_pivots.category",
          "hotel_opportunity_pivots.description"
        )
        .innerJoin("hotel_opportunity_pivots", "hotel_opportunities.id", "hotel_opportunity_pivots.hotel_opportunity_id")
        .where("hotel_opportunity_pivots.language_code", language)
        .whereNull("hotel_opportunity_pivots.deleted_at");

      if (hotel_id) {
        query = query.where("hotel_opportunities.hotel_id", hotel_id);
      }

      const hotelOpportunities = await query;
      
      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_FETCHED_SUCCESS"),
        data: hotelOpportunities,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const language = (req as any).language;

      const hotelOpportunity = await knex("hotel_opportunities")
        .whereNull("hotel_opportunities.deleted_at")
        .where("hotel_opportunities.id", id)
        .select(
          "hotel_opportunities.*", 
          "hotel_opportunity_pivots.category",
          "hotel_opportunity_pivots.description"
        )
        .innerJoin("hotel_opportunity_pivots", "hotel_opportunities.id", "hotel_opportunity_pivots.hotel_opportunity_id")
        .where("hotel_opportunity_pivots.language_code", language)
        .whereNull("hotel_opportunity_pivots.deleted_at")
        .first();

      if (!hotelOpportunity) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_FETCHED_SUCCESS"),
        data: hotelOpportunity,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        hotel_id,
        category,
        description
      } = req.body as {
        hotel_id: string;
        category: string;
        description: string;
      };
      const existHotel = await new HotelModel().findId(hotel_id);
      if (!existHotel) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      // Validate hotel_id
      const existingHotel = await new HotelOpportunityModel().existOpportunity({
        hotel_id,
        category,
      });

      if (existingHotel) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_ALREADY_EXISTS"),
        });
      } 

      // Create hotel opportunity
      const hotelOpportunity = await new HotelOpportunityModel().create({
        hotel_id,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "hotel_opportunity_pivots",
        target_id_key: "hotel_opportunity_id",
        target_id: hotelOpportunity.id,
        language_code: (req as any).language,
        data: {
          category,
          description,
        },
      });

      hotelOpportunity.hotel_opportunity_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_CREATED_SUCCESS"),
        data: hotelOpportunity,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { 
        hotel_id,
        category,
        description
      } = req.body as {
        hotel_id?: string;
        category?: string;
        description?: string;
      };

      const existingHotelOpportunity = await new HotelOpportunityModel().first({ id });

      if (!existingHotelOpportunity) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_NOT_FOUND"),
        });
      }

      // Validate hotel_id if provided
      if (hotel_id) {
        const existingHotel = await new HotelModel().first({
          "hotels.id": hotel_id,
        });

        if (!existingHotel) {
          return res.status(400).send({
            success: false,
            message: req.t("HOTEL.HOTEL_NOT_FOUND"),
          });
        }
      }

      // Update hotel opportunity if hotel_id is provided
      if (hotel_id) {
        await new HotelOpportunityModel().update(id, {
          hotel_id: hotel_id !== undefined ? hotel_id : existingHotelOpportunity.hotel_id,
        });
      }
      
      // Update translations if provided
      if (category || description) {
        await translateUpdate({
          target: "hotel_opportunity_pivots",
          target_id_key: "hotel_opportunity_id",
          target_id: id,
          data: {
            ...(category && { category }),
            ...(description && { description }),
          },
          language_code: (req as any).language,
        });
      }

      const updatedHotelOpportunity = await new HotelOpportunityModel().oneToMany(
        id,
        "hotel_opportunity_pivots",
        "hotel_opportunity_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_UPDATED_SUCCESS"),
        data: updatedHotelOpportunity,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingHotelOpportunity = await new HotelOpportunityModel().first({ id });

      if (!existingHotelOpportunity) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_NOT_FOUND"),
        });
      }

      await new HotelOpportunityModel().delete(id);
      await knex("hotel_opportunity_pivots")
        .where("hotel_opportunity_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_OPPORTUNITY.HOTEL_OPPORTUNITY_DELETED_ERROR"),
      });
    }
  }
}
