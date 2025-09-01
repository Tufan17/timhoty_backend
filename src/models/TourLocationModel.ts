import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourLocationModel extends BaseModel {
  constructor() {
    super("tour_locations");
  }
  static columns = [
    'id',
    'tour_id',
    'location_id',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
  async deleteByTourId(tourId: string) {
    await knex("tour_locations")
      .where("tour_id", tourId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async deleteByLocationId(locationId: string) {
    await knex("tour_locations")
      .where("location_id", locationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getLocationsByTourId(tourId: string) {
    return await knex("tour_locations")
      .select("tour_locations.*", "cities.name as city_name", "countries.name as country_name")
      .join("cities", "tour_locations.location_id", "cities.id")
      .join("countries", "cities.country_id", "countries.id")
      .where("tour_locations.tour_id", tourId)
      .whereNull("tour_locations.deleted_at");
  }

  async getToursByLocationId(locationId: string) {
    return await knex("tour_locations")
      .select("tour_locations.*", "tours.*")
      .join("tours", "tour_locations.tour_id", "tours.id")
      .where("tour_locations.location_id", locationId)
      .whereNull("tour_locations.deleted_at")
      .whereNull("tours.deleted_at");
  }
}

export default TourLocationModel;
