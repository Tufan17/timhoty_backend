import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class HotelOpportunityModel extends BaseModel {
  constructor() {
    super("hotel_opportunities");
  }
  static columns = [
    'id',
    'hotel_id',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
  async existOpportunity(data: { hotel_id: string; category: string }) {
    const { hotel_id, category } = data;
    const opportunity = await knex("hotel_opportunities")
      .whereNull("hotel_opportunities.deleted_at")
      .leftJoin("hotel_opportunity_pivots", "hotel_opportunities.id", "hotel_opportunity_pivots.hotel_opportunity_id")
      .where("hotel_id", hotel_id)
      .where("hotel_opportunity_pivots.category", category)
      .first();
    return !!opportunity;
  }
}

export default HotelOpportunityModel;
