import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class StationModel extends BaseModel {
  constructor() {
    super("stations");
  }
  static columns = [
    'id',
    'location_id',
    'map_location',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getStations(language: string, location_id: string) {
    return await knex("stations")
    .whereNull("stations.deleted_at")
    .where("stations.status", true)
    .innerJoin("station_pivots", "stations.id", "station_pivots.station_id")
    .whereNull("station_pivots.deleted_at")
    .modify(qb => {
      if (location_id) {
        qb.where("stations.location_id", location_id);
      }
    })
    .where("station_pivots.language_code", language)
    .select("stations.*", "station_pivots.name as name");
  }
}

export default StationModel;
