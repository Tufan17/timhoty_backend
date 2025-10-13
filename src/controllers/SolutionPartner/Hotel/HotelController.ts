import { FastifyRequest, FastifyReply } from "fastify";
import knex from "../../../db/knex";
import HotelModel from "@/models/HotelModel";
import { translateCreate, translateUpdate } from "@/helper/translate";
import CityModel from "@/models/CityModel";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";
import HotelRoomModel from "@/models/HotelRoomModel";
import HotelGalleryModel from "@/models/HotelGalleryModel";
import HotelOpportunityModel from "@/models/HotelOpportunityModel";
import HotelFeatureModel from "@/models/HotelFeatureModel";
import HotelRoomFeatureModel from "@/models/HotelRoomFeatureModel";
import HotelRoomImageModel from "@/models/HotelRoomImageModel";
import HotelRoomOpportunityModel from "@/models/HotelRoomOpportunityModel";
import HotelRoomPackageModel from "@/models/HotelRoomPackageModel";

export default class HotelController {
  async dataTable(req: FastifyRequest, res: FastifyReply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        location_id,
        solution_partner_id,
        status,
        admin_approval,
        highlight,
      } = req.query as {
        page: number;
        limit: number;
        search: string;
        location_id?: string;
        solution_partner_id?: string;
        status?: boolean;
        admin_approval?: boolean;
        highlight?: boolean;
      };

      const language = (req as any).language;
      const solutionPartnerUser = (req as any).user;
      const spFromUser = solutionPartnerUser?.solution_partner_id;
      const base = knex("hotels")
        .whereNull("hotels.deleted_at")
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .innerJoin("cities", "hotels.location_id", "cities.id")
        .innerJoin(
          "country_pivots",
          "cities.country_id",
          "country_pivots.country_id"
        )
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("hotel_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .whereNull("cities.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("hotel_pivots.deleted_at")
        .modify((qb) => {
          // solution_partner_id (önce user'dan, yoksa query)
          if (spFromUser) qb.where("hotels.solution_partner_id", spFromUser);
          else if (solution_partner_id)
            qb.where("hotels.solution_partner_id", solution_partner_id);

          if (typeof status !== "undefined") qb.where("hotels.status", status);
          if (typeof admin_approval !== "undefined")
            qb.where("hotels.admin_approval", admin_approval);
          if (typeof highlight !== "undefined")
            qb.where("hotels.highlight", highlight);
          if (location_id) qb.where("hotels.location_id", location_id);

          if (search) {
            const like = `%${search}%`;
            qb.andWhere((w) => {
              w.where("hotel_pivots.name", "ilike", like)
                .orWhere("hotel_pivots.general_info", "ilike", like)
                .orWhere("hotel_pivots.hotel_info", "ilike", like)
                .orWhere("country_pivots.name", "ilike", like)
                .orWhere("city_pivots.name", "ilike", like);
            });

            // "true"/"false" metni status filtresine eşlensin (opsiyonel)
            const sv = search.toLowerCase();
            if (sv === "true" || sv === "false") {
              qb.orWhere("hotels.status", sv === "true");
            }
          }
        });

      // Toplam sayım (benzersiz otel)
      const countRow = await base
        .clone()
        .clearSelect()
        .clearOrder()
        .countDistinct<{ total: string }>("hotels.id as total")
        .first();

      const total = Number(countRow?.total ?? 0);
      const totalPages = Math.ceil(total / Number(limit));

      // Veri seçimi
      const data = await base
        .clone()
        .distinct("hotels.id") // aynı otel birden fazla pivot kaydına düşmesin
        .whereNull("hotels.deleted_at")
        .modify((qb) => {
          if (spFromUser) qb.where("hotels.solution_partner_id", spFromUser);
        })
        .select(
          "hotels.*",
          knex.ref("hotel_pivots.name").as("name"),
          "hotel_pivots.general_info",
          "hotel_pivots.hotel_info",
          "hotel_pivots.refund_policy",
          knex.ref("country_pivots.name").as("country_name"),
          knex.ref("city_pivots.name").as("city_name")
        )
        .orderBy("hotels.created_at", "desc")
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));
      const newData = data.map((item: any) => {
        return {
          ...item,
          address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
        };
      });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
        data: newData,
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
        message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
      });
    }
  }

  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = req.language;
      const hotels = await knex("hotels")
        .whereNull("hotels.deleted_at")
        .select(
          "hotels.*",
          "hotel_pivots.name as name",
          "hotel_pivots.general_info",
          "hotel_pivots.hotel_info",
          "hotel_pivots.refund_policy"
        )
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .where("hotel_pivots.language_code", language);

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
        data: hotels as any,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const hotel = await knex("hotels")
        .whereNull("hotels.deleted_at")
        .where("hotels.id", id)
        .select(
          "hotels.*",
          "hotel_pivots.name as name",
          "hotel_pivots.general_info",
          "hotel_pivots.hotel_info",
          "hotel_pivots.refund_policy"
        )
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .where("hotel_pivots.language_code", req.language)
        .first();

      if (!hotel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      if (hotel.location_id) {
        const city = await knex("cities")
          .where("cities.id", hotel.location_id)
          .whereNull("cities.deleted_at")
          .innerJoin(
            "country_pivots",
            "cities.country_id",
            "country_pivots.country_id"
          )
          .where("country_pivots.language_code", req.language)
          .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
          .where("city_pivots.language_code", req.language)
          .whereNull("cities.deleted_at")
          .whereNull("country_pivots.deleted_at")
          .whereNull("city_pivots.deleted_at")
          .select(
            "country_pivots.name as country_name",
            "city_pivots.name as city_name"
          )
          .first();
        hotel.location = city;
        hotel.address = `${city.country_name}, ${city.city_name}`;
      }

      const hotelOpportunities = await knex("hotel_opportunities")
        .where("hotel_opportunities.hotel_id", id)
        .whereNull("hotel_opportunities.deleted_at")
        .innerJoin(
          "hotel_opportunity_pivots",
          "hotel_opportunities.id",
          "hotel_opportunity_pivots.hotel_opportunity_id"
        )
        .where("hotel_opportunity_pivots.language_code", req.language)
        .select(
          "hotel_opportunities.*",
          "hotel_opportunity_pivots.category",
          "hotel_opportunity_pivots.description"
        );
      hotel.hotel_opportunities = hotelOpportunities;

      const hotelFeatures = await knex("hotel_features")
        .where("hotel_features.hotel_id", id)
        .whereNull("hotel_features.deleted_at")
        .innerJoin(
          "hotel_feature_pivots",
          "hotel_features.id",
          "hotel_feature_pivots.hotel_feature_id"
        )
        .where("hotel_feature_pivots.language_code", req.language)
        .select("hotel_features.*", "hotel_feature_pivots.name");
      hotel.hotel_features = hotelFeatures;

      const hotelRooms = await knex("hotel_rooms")
        .where("hotel_rooms.hotel_id", id)
        .whereNull("hotel_rooms.deleted_at")
        .innerJoin(
          "hotel_room_pivots",
          "hotel_rooms.id",
          "hotel_room_pivots.hotel_room_id"
        )
        .where("hotel_room_pivots.language_code", req.language)
        .select(
          "hotel_rooms.*",
          "hotel_room_pivots.name",
          "hotel_room_pivots.description",
          "hotel_room_pivots.refund_policy"
        );
      hotel.hotel_rooms = hotelRooms;

      const hotelGalleries = await knex("hotel_galleries")
        .where("hotel_galleries.hotel_id", id)
        .whereNull("hotel_galleries.deleted_at")
        .leftJoin(
          "hotel_gallery_pivot",
          "hotel_galleries.id",
          "hotel_gallery_pivot.hotel_gallery_id"
        )
        .where("hotel_gallery_pivot.language_code", req.language)
        .whereNull("hotel_gallery_pivot.deleted_at")
        .select("hotel_galleries.*", "hotel_gallery_pivot.category");
      hotel.hotel_galleries = hotelGalleries;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
        data: hotel,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      // Get the authenticated solution partner from the request
      const solutionPartnerUser = (req as any).user;

      const {
        location_id,
        pool = false,
        private_beach = false,
        transfer = false,
        map_location,
        free_age_limit,
        status = false,
        highlight = false,
        refund_days,
        name,
        general_info,
        hotel_info,
        refund_policy,
        star_rating,
      } = req.body as {
        location_id: string;
        pool?: boolean;
        private_beach?: boolean;
        transfer?: boolean;
        map_location?: string;
        free_age_limit?: number;
        status?: boolean;
        highlight?: boolean;
        refund_days?: number;
        name: string;
        general_info: string;
        hotel_info: string;
        refund_policy: string;
        star_rating?: number;
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

      const hotel = await new HotelModel().create({
        location_id,
        pool,
        private_beach,
        transfer,
        map_location,
        free_age_limit,
        solution_partner_id: solutionPartnerUser?.solution_partner_id,
        status: false,
        highlight,
        refund_days,
        star_rating,
      });

      const translateResult = await translateCreate({
        target: "hotel_pivots",
        target_id_key: "hotel_id",
        target_id: hotel.id,
        language_code: req.language,
        data: {
          name,
          general_info,
          hotel_info,
          refund_policy,
        },
      });
      hotel.hotel_pivots = translateResult;

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_CREATED_SUCCESS"),
        data: hotel,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_CREATED_ERROR"),
      });
    }
  }

  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const {
        location_id,
        pool,
        star_rating,
        private_beach,
        transfer,
        map_location,
        free_age_limit,
        solution_partner_id,
        status,
        highlight,
        refund_days,
        name,
        general_info,
        hotel_info,
        refund_policy,
      } = req.body as {
        location_id?: string;
        pool?: boolean;
        private_beach?: boolean;
        transfer?: boolean;
        map_location?: string;
        free_age_limit?: number;
        solution_partner_id?: string;
        status?: boolean;
        highlight?: boolean;
        refund_days?: number;
        name?: string;
        general_info?: string;
        hotel_info?: string;
        refund_policy?: string;
        star_rating?: number;
      };

      const existingHotel = await new HotelModel().first({ id });

      if (!existingHotel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
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

      // Validate solution_partner_id if provided
      if (solution_partner_id) {
        const existingSolutionPartner = await new SolutionPartnerModel().first({
          "solution_partners.id": solution_partner_id,
        });

        if (!existingSolutionPartner) {
          return res.status(400).send({
            success: false,
            message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
          });
        }
      }

      let body: any = {
        location_id:
          location_id !== undefined ? location_id : existingHotel.location_id,
        pool: pool !== undefined ? pool : existingHotel.pool,
        private_beach:
          private_beach !== undefined
            ? private_beach
            : existingHotel.private_beach,
        transfer: transfer !== undefined ? transfer : existingHotel.transfer,
        map_location:
          map_location !== undefined
            ? map_location
            : existingHotel.map_location,
        free_age_limit:
          free_age_limit !== undefined
            ? free_age_limit
            : existingHotel.free_age_limit,
        solution_partner_id:
          solution_partner_id !== undefined
            ? solution_partner_id
            : existingHotel.solution_partner_id,
        status: status !== undefined ? status : existingHotel.status,
        highlight:
          highlight !== undefined ? highlight : existingHotel.highlight,
        refund_days:
          refund_days !== undefined ? refund_days : existingHotel.refund_days,
        admin_approval: false,
        star_rating:
          star_rating !== undefined ? star_rating : existingHotel.star_rating,
      };

      await new HotelModel().update(id, body);

      // Update translations if provided
      if (name || general_info || hotel_info || refund_policy) {
        await translateUpdate({
          target: "hotel_pivots",
          target_id_key: "hotel_id",
          target_id: id,
          data: {
            ...(name && { name }),
            ...(general_info && { general_info }),
            ...(hotel_info && { hotel_info }),
            ...(refund_policy && { refund_policy }),
          },
          language_code: req.language,
        });
      }

      const updatedHotel = await new HotelModel().oneToMany(
        id,
        "hotel_pivots",
        "hotel_id"
      );

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_UPDATED_SUCCESS"),
        data: updatedHotel,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingHotel = await new HotelModel().first({ id });

      if (!existingHotel) {
        return res.status(404).send({
          success: false,
          message: req.t("HOTEL.HOTEL_NOT_FOUND"),
        });
      }

      await new HotelModel().delete(id);
      await knex("hotel_pivots")
        .where("hotel_id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_DELETED_ERROR"),
      });
    }
  }

  async sendForApproval(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      let hotel = await new HotelModel().exists({ id });
      let hotelRoom = await new HotelRoomModel().first({ hotel_id: id });
      let hotelGalleries = await new HotelGalleryModel().exists({
        hotel_id: id,
      });
      let hotelOpportunities = await new HotelOpportunityModel().exists({
        hotel_id: id,
      });
      let hotelFeatures = await new HotelFeatureModel().exists({
        hotel_id: id,
      });
      let hotelRoomOpportunities = await new HotelRoomOpportunityModel().exists(
        { hotel_room_id: hotelRoom?.id }
      );
      let hotelRoomFeatures = await new HotelRoomFeatureModel().exists({
        hotel_room_id: hotelRoom?.id,
      });
      let hotelRoomImages = await new HotelRoomImageModel().exists({
        hotel_room_id: hotelRoom?.id,
      });
      let hotelRoomPackages = await new HotelRoomPackageModel().exists({
        hotel_room_id: hotelRoom?.id,
      });

      const data = {
        hotel,
        hotelRooms: hotelRoom ? true : false,
        hotelGalleries,
        hotelOpportunities,
        hotelFeatures,
        hotelRoomOpportunities,
        hotelRoomFeatures,
        hotelRoomImages,
        hotelRoomPackages,
      };

      if (
        hotel && hotelRoom
          ? true
          : false &&
            hotelGalleries &&
            hotelOpportunities &&
            hotelFeatures &&
            hotelRoomOpportunities &&
            hotelRoomFeatures &&
            hotelRoomImages &&
            hotelRoomPackages
      ) {
        await new HotelModel().update(id, {
          status: true,
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_SEND_FOR_APPROVAL_SUCCESS"),
        data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_SEND_FOR_APPROVAL_ERROR"),
      });
    }
  }
}
