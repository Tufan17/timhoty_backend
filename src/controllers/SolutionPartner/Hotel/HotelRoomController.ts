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
      const language = (req as any).language;

      const hotelRoom = await knex("hotel_rooms")
        .whereNull("hotel_rooms.deleted_at")
        .where("hotel_rooms.id", id)
        .select(
          "hotel_rooms.*", 
          "hotel_room_pivots.name",
          "hotel_room_pivots.description",
          "hotel_room_pivots.refund_policy"
        )
        .innerJoin("hotel_room_pivots", "hotel_rooms.id", "hotel_room_pivots.hotel_room_id")
        .where("hotel_room_pivots.language_code", language)
        .whereNull("hotel_room_pivots.deleted_at")
        .first();

      if (!hotelRoom) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM.HOTEL_ROOM_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL_ROOM.HOTEL_ROOM_FETCHED_SUCCESS"),
        data: hotelRoom,
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
        refund_policy
      } = req.body as {
        hotel_id: string;
        name: string;
        description: string;
        refund_policy: string;
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
        refund_policy
      } = req.body as {
        hotel_id?: string;
        name?: string;
        description?: string;
        refund_policy?: string;
      };

      const existingHotelRoom = await new HotelRoomModel().first({ id });

      if (!existingHotelRoom) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL_ROOM.HOTEL_ROOM_NOT_FOUND"),
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

      // Update hotel room if hotel_id is provided
      if (hotel_id) {
        await new HotelRoomModel().update(id, {
          hotel_id: hotel_id !== undefined ? hotel_id : existingHotelRoom.hotel_id,
        });
      }
      
      // Update translations if provided
      if (name || description || refund_policy) {
        await translateUpdate({
          target: "hotel_room_pivots",
          target_id_key: "hotel_room_id",
          target_id: id,
          data: {
            ...(name && { name }),
            ...(description && { description }),
            ...(refund_policy && { refund_policy }),
          },
          language_code: (req as any).language,
        });
      }

      const updatedHotelRoom = await new HotelRoomModel().oneToMany(
        id,
        "hotel_room_pivots",
        "hotel_room_id"
      );

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
