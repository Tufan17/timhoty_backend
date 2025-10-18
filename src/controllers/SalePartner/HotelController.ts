import { FastifyRequest, FastifyReply } from "fastify";
import knex from "@/db/knex";

export default class HotelController {
  async getApprovedHotels(req: FastifyRequest, res: FastifyReply) {
    try {
      const language = (req as any).language;
      
      // Get hotels with pivot table data, filtering for admin approval and active status
      const hotels = await knex("hotels")
        .whereNull("hotels.deleted_at")
        .where("hotels.admin_approval", true)  // Admin approved
        .where("hotels.status", true)          // Active status
        .innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
        .innerJoin("cities", "hotels.location_id", "cities.id")
        .innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
        .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
        .where("hotel_pivots.language_code", language)
        .where("country_pivots.language_code", language)
        .where("city_pivots.language_code", language)
        .whereNull("cities.deleted_at")
        .whereNull("country_pivots.deleted_at")
        .whereNull("city_pivots.deleted_at")
        .whereNull("hotel_pivots.deleted_at")
        .select(
          "hotels.id",
          "hotels.location_id",
          "hotels.pool",
          "hotels.private_beach",
          "hotels.transfer",
          "hotels.map_location",
          "hotels.free_age_limit",
          "hotels.solution_partner_id",
          "hotels.star_rating",
          "hotels.status",
          "hotels.admin_approval",
          "hotels.highlight",
          "hotels.comment_count",
          "hotels.average_rating",
          "hotels.refund_days",
          "hotels.created_at",
          "hotels.updated_at",
          "hotel_pivots.name",
          "hotel_pivots.general_info",
          "hotel_pivots.hotel_info",
          "hotel_pivots.refund_policy",
          "country_pivots.name as country_name",
          "city_pivots.name as city_name"
        )
        .orderBy("hotels.created_at", "desc");

      // Format the response with address information
      const formattedHotels = hotels.map((hotel: any) => ({
        ...hotel,
        address: `${hotel.country_name || ""}, ${hotel.city_name || ""}`.trim(),
      }));

      return res.status(200).send({
        success: true,
        message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
        data: formattedHotels,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
      });
    }
  }
}
