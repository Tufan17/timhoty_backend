import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class TourDeparturePointModel extends BaseModel {
	constructor() {
		super("tour_departure_points")
	}
	static columns = ["id", "tour_id", "location_id", "created_at", "updated_at", "deleted_at"]

	async deleteByTourId(tourId: string) {
		await knex("tour_departure_points").where("tour_id", tourId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async deleteByLocationId(locationId: string) {
		await knex("tour_departure_points").where("location_id", locationId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async getDeparturePointsByTourId(tourId: string) {
		return await knex("tour_departure_points").select("tour_departure_points.*", "cities.name as city_name", "countries.name as country_name").join("cities", "tour_departure_points.location_id", "cities.id").join("countries", "cities.country_id", "countries.id").where("tour_departure_points.tour_id", tourId).whereNull("tour_departure_points.deleted_at")
	}

	async getToursByDeparturePointId(locationId: string) {
		return await knex("tour_departure_points").select("tour_departure_points.*", "tours.*").join("tours", "tour_departure_points.tour_id", "tours.id").where("tour_departure_points.location_id", locationId).whereNull("tour_departure_points.deleted_at").whereNull("tours.deleted_at")
	}
}

export default TourDeparturePointModel
