import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class CityModel extends BaseModel {
	constructor() {
		super("cities")
	}
	static columns = ["id", "destination_id", "country_id", "photo", "number_plate", "is_active", "created_at", "updated_at"]

	// veri tabanında otel tur aktivite vize ve kiralık araba ekli olan 4 şeihiri listelemek istiyorum ve bunların sayısını da istiyorum
	/**
	 * Returns the top 4 cities (by usage count) that have at least one hotel, activity, visa, or car rental,
	 * including their name and photo in the given language.
	 */
	async getDashboardCities(language: string): Promise<any[]> {
		const citiesId = ["76ef53db-f690-4788-a71a-d15b67d632d8", "7ca0cc4f-767a-40c7-beea-e981e3d80580", "a1cbe96e-e576-4741-b8e6-767fa4024e96"]

		const cities = await knex("cities")
			.whereIn("cities.id", citiesId)
			.whereNull("cities.deleted_at")
			.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
			.where("city_pivots.language_code", language)
			.whereNull("city_pivots.deleted_at")
			.leftJoin("countries", "cities.country_id", "countries.id")
			.leftJoin("hotels", function () {
				this.on("hotels.location_id", "cities.id").andOnNull("hotels.deleted_at").andOnVal("hotels.status", "=", true).andOnVal("hotels.admin_approval", "=", true)
			})

			.leftJoin("visas", function () {
				this.on("visas.location_id", "countries.id").andOnNull("visas.deleted_at").andOnVal("visas.status", "=", true).andOnVal("visas.admin_approval", "=", true)
			})
			.leftJoin("car_rentals", function () {
				this.on("car_rentals.location_id", "cities.id").andOnNull("car_rentals.deleted_at").andOnVal("car_rentals.status", "=", true).andOnVal("car_rentals.admin_approval", "=", true)
			})
			.groupBy("cities.id", "cities.photo", "city_pivots.name")
			.select(
				"cities.id",
				"cities.photo",
				"city_pivots.name",
				knex.raw("COUNT(DISTINCT hotels.id) as hotels_count"),
				knex.raw(`(
					SELECT COUNT(DISTINCT t.id)
					FROM tour_locations tl
					INNER JOIN tours t ON t.id = tl.tour_id
					INNER JOIN tour_packages tp ON tp.tour_id = t.id
					INNER JOIN tour_package_prices tpp ON tpp.tour_package_id = tp.id
					WHERE tl.location_id = cities.id
					AND tl.deleted_at IS NULL
					AND t.deleted_at IS NULL
					AND t.status = true
					AND t.admin_approval = true
					AND tp.deleted_at IS NULL
					AND tpp.deleted_at IS NULL
					AND tpp.date >= CURRENT_DATE
				) as tour_locations_count`),
				knex.raw(`(
					SELECT COUNT(DISTINCT a.id)
					FROM activities a
					INNER JOIN activity_packages ap ON ap.activity_id = a.id
					INNER JOIN activity_package_prices app ON app.activity_package_id = ap.id
					WHERE a.location_id = cities.id
					AND a.deleted_at IS NULL
					AND a.status = true
					AND a.admin_approval = true
					AND ap.deleted_at IS NULL
					AND app.deleted_at IS NULL
					AND (
						ap.constant_price = true
						OR (
							ap.constant_price = false
							AND app.start_date <= CURRENT_DATE
							AND (app.end_date IS NULL OR app.end_date >= CURRENT_DATE)
						)
					)
				) as activities_count`),
				knex.raw("COUNT(DISTINCT visas.id) as visas_count"),
				knex.raw("COUNT(DISTINCT car_rentals.id) as car_rentals_count"),
			)
			.limit(4)

		return cities
	}

	getCitiesAndCountries(language: string): Promise<any[]> {
		return knex("cities")
			.whereNull("cities.deleted_at")
			.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
			.where("city_pivots.language_code", language)
			.whereNull("city_pivots.deleted_at")
			.innerJoin("countries", "cities.country_id", "countries.id")
			.innerJoin("country_pivots", function () {
				this.on("countries.id", "country_pivots.country_id")
					.andOn("country_pivots.language_code", knex.raw("?", [language]))
					.andOnNull("country_pivots.deleted_at")
			})
			.select("cities.id as id", "city_pivots.name as city_name", "country_pivots.name as country_name")
	}
}

export default CityModel
