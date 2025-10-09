import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class HotelReservationSpecialRequestModel extends BaseModel {
  constructor() {
    super("hotel_reservation_special_requests");
  }

  static columns = [
    'id',
    'hotel_reservation_id',
    'request',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getRequestsByReservationId(hotelReservationId: string) {
    return await knex("hotel_reservation_special_requests")
      .where("hotel_reservation_id", hotelReservationId)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async createRequest(hotelReservationId: string, request: number) {
    return await knex("hotel_reservation_special_requests")
      .insert({
        hotel_reservation_id: hotelReservationId,
        request: request,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning("*");
  }

  async deleteByReservationId(hotelReservationId: string) {
    return await knex("hotel_reservation_special_requests")
      .where("hotel_reservation_id", hotelReservationId)
      .update({ 
        deleted_at: new Date(),
        updated_at: new Date()
      });
  }

  async getRequestStats() {
    const total = await knex("hotel_reservation_special_requests")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const byType = await knex("hotel_reservation_special_requests")
      .whereNull("deleted_at")
      .select("request")
      .count("id as count")
      .groupBy("request")
      .orderBy("count", "desc");

    return {
      total: total?.total || 0,
      by_type: byType
    };
  }
}

export default HotelReservationSpecialRequestModel;
