import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import HotelRoomModel from "@/models/HotelRoomModel";
import HotelRoomPivotModel from "@/models/HotelRoomPivotModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import HotelModel from "@/models/HotelModel";

export default class HotelRoomController {
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
      const base = knex("hotel_rooms")
        .whereNull("hotel_rooms.deleted_at")
        .innerJoin("hotel_room_pivots", "hotel_rooms.id", "hotel_room_pivots.hotel_room_id")
        .innerJoin("hotels", "hotel_rooms.hotel_id", "hotels.id")
        .where("hotel_room_pivots.language_code", language)
        .whereNull("hotel_room_pivots.deleted_at")
        .whereNull("hotels.deleted_at")
        .modify((qb) => {
          // Filter by solution partner from authenticated user
          if (spFromUser) qb.where("hotels.solution_partner_id", spFromUser);

          if (hotel_id) qb.where("hotel_rooms.hotel_id", hotel_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_room_pivots.name", "ilike", like)
                .orWhere("hotel_room_pivots.description", "ilike", like)
                .orWhere("hotel_room_pivots.refund_policy", "ilike", like);
            });
          }
        });

      // Count total records
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("hotel_rooms.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Get data
      const data = await base
        .clone()
        .distinct("hotel_rooms.id")
        .select(
          "hotel_rooms.*",
          "hotel_room_pivots.name",
          "hotel_room_pivots.description",
          "hotel_room_pivots.refund_policy",
          "hotels.location_id"
        )
        .orderBy("hotel_rooms.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_SUCCESS"),
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
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      const { hotel_id } = req.query as { hotel_id?: string };

      let query = knex("hotel_rooms")
        .whereNull("hotel_rooms.deleted_at")
        .select(
          "hotel_rooms.*", 
          "hotel_room_pivots.name",
          "hotel_room_pivots.description",
          "hotel_room_pivots.refund_policy"
        )
        .innerJoin("hotel_room_pivots", "hotel_rooms.id", "hotel_room_pivots.hotel_room_id")
        .where("hotel_room_pivots.language_code", language)
        .whereNull("hotel_room_pivots.deleted_at");

      if (hotel_id) {
        query = query.where("hotel_rooms.hotel_id", hotel_id);
      }

      const hotelRooms = await query;
      
      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_SUCCESS"),
        data: hotelRooms,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const hotel = await knex("hotel_rooms")
        .whereNull("hotel_rooms.deleted_at")
        .where("hotel_rooms.id", id)
        .select(
          "hotel_rooms.*", 
          "hotel_room_pivots.name as name",
          "hotel_room_pivots.description",
          "hotel_room_pivots.refund_policy"
        )
        .innerJoin("hotel_room_pivots", "hotel_rooms.id", "hotel_room_pivots.hotel_room_id")
        .where("hotel_room_pivots.language_code", req.language)
        .first();

        if(!hotel){
          return res.status(404).send({
            success: false,
            message: req.t("HOTEL_ROOM.HOTEL_ROOM_NOT_FOUND"),
          });
        }

        if(hotel.hotel_id){
          const hotelInfo = await knex("hotels")
            .where("hotels.id", hotel.hotel_id)
            .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id") 
            .where("hotel_pivots.language_code", req.language)
            .whereNull("hotels.deleted_at")
            .select(
              "hotels.*",
              "hotel_pivots.name as name"
            ).first();
            hotel.hotel = hotelInfo;
        }

        const hotelRoomOpportunities = await knex("hotel_room_opportunities")
          .where("hotel_room_opportunities.hotel_room_id", id)
          .whereNull("hotel_room_opportunities.deleted_at")
          .innerJoin("hotel_room_opportunity_pivots", "hotel_room_opportunities.id", "hotel_room_opportunity_pivots.hotel_room_opportunity_id")
          .where("hotel_room_opportunity_pivots.language_code", req.language)
          .select("hotel_room_opportunities.*", "hotel_room_opportunity_pivots.name");
        hotel.hotel_room_opportunities = hotelRoomOpportunities;


        const hotelRoomFeatures = await knex("hotel_room_features")
          .where("hotel_room_features.hotel_room_id", id)
          .whereNull("hotel_room_features.deleted_at")
          .innerJoin("hotel_room_feature_pivots", "hotel_room_features.id", "hotel_room_feature_pivots.hotel_room_feature_id")
          .where("hotel_room_feature_pivots.language_code", req.language)
          .select("hotel_room_features.*", "hotel_room_feature_pivots.name");
        hotel.hotel_room_features = hotelRoomFeatures;

        const hotelRoomImages = await knex("hotel_room_images")
          .where("hotel_room_images.hotel_room_id", id)
          .whereNull("hotel_room_images.deleted_at")
          .select("hotel_room_images.*");
        hotel.hotel_room_images = hotelRoomImages;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_SUCCESS"),
        data: hotel,
      });
    } catch (error) {
      console.log(error); 
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { 
        hotel_id,
        name,
        description,
        refund_policy,
        refund_days,
      } = req.body as {
        hotel_id: string;
        name: string;
        description: string;
        refund_policy: string;
        refund_days: number;
      };

      // Validate hotel_id
      const existingHotel = await new HotelModel().first({
        "hotels.id": hotel_id,
      });

      if (!existingHotel) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      // Create hotel room
      const hotelRoom = await new HotelRoomModel().create({
        hotel_id,
        refund_days,
      });

      // Create translations
      const translateResult = await translateCreate({
        target: "hotel_room_pivots",
        target_id_key: "hotel_room_id",
        target_id: hotelRoom.id,
        language_code: (req as any).language,
        data: {
          name,
          description,
          refund_policy,
        },
      });

      hotelRoom.hotel_room_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_CREATED_SUCCESS"),
        data: hotelRoom,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { 
        hotel_id,
        name,
        description,
        refund_policy,
        refund_days,
      } = req.body as {
        hotel_id?: string;
        name?: string;
        description?: string;
        refund_policy?: string;
        refund_days?: number;
      };

      // Check if anything to update
      if (!hotel_id && !name && !description && !refund_policy && refund_days === undefined) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL_ROOM.NO_UPDATE_DATA"),
        });
      }

      // Prepare parallel operations
      const operations = [];

      // Check hotel room existence
      operations.push(new HotelRoomModel().first({ id }));

      // Validate hotel if hotel_id is provided
      if (hotel_id) {
        operations.push(new HotelModel().first({ "hotels.id": hotel_id }));
      }

      const results = await Promise.all(operations);
      const existingHotelRoom = results[0];

      if (!existingHotelRoom) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM.HOTEL_ROOM_NOT_FOUND"),
        });
      }

      // Check hotel existence if hotel_id was provided
      if (hotel_id && !results[1]) {
        return res.status(400).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      // Prepare update operations
      const updateOperations = [];

      // Update hotel room if hotel_id or refund_days changed
      if (hotel_id || refund_days !== undefined) {
        const updateData: any = {};
        if (hotel_id) updateData.hotel_id = hotel_id;
        if (refund_days !== undefined) updateData.refund_days = refund_days;
        
        updateOperations.push(new HotelRoomModel().update(id, updateData));
      }

      // Update translations if provided
      if (name || description || refund_policy) {
        const translateData: any = {};
        if (name) translateData.name = name;
        if (description) translateData.description = description;
        if (refund_policy) translateData.refund_policy = refund_policy;

        updateOperations.push(translateUpdate({
          target: "hotel_room_pivots",
          target_id_key: "hotel_room_id",
          target_id: id,
          data: translateData,
          language_code: (req as any).language,
        }));
      }

      // Execute all updates in parallel
      const updateResults = await Promise.all(updateOperations);
      
      let updatedHotelRoom = existingHotelRoom;
      let hotel_room_pivots = null;

      // Process results
      if (hotel_id || refund_days !== undefined) {
        updatedHotelRoom = updateResults[0] || existingHotelRoom;
        if (name || description || refund_policy) {
          hotel_room_pivots = updateResults[1];
        }
      } else if (name || description || refund_policy) {
        hotel_room_pivots = updateResults[0];
      }

      // Attach pivot data if available
      if (hotel_room_pivots) {
        updatedHotelRoom = { ...updatedHotelRoom, hotel_room_pivots };
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_UPDATED_SUCCESS"),
        data: updatedHotelRoom,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingHotelRoom = await new HotelRoomModel().first({ id });

      if (!existingHotelRoom) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM.HOTEL_ROOM_NOT_FOUND"),
        });
      }

      await new HotelRoomModel().delete(id);
      await knex("hotel_room_pivots")
        .where("hotel_room_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_DELETED_ERROR"),
      });
    }
  }
}
