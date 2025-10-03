import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CityModel extends BaseModel {
  constructor() {
    super("cities");
  }
  static columns = [
    "id",
    "country_id",
    "photo",
    "is_active",
    "created_at",
    "updated_at",
  ];

  // veri tabanında otel tur aktivite vize ve kiralık araba ekli olan 4 şeihiri listelemek istiyorum ve bunların sayısını da istiyorum
  /**
   * Returns the top 4 cities (by usage count) that have at least one hotel, activity, visa, or car rental,
   * including their name and photo in the given language.
   */
  async getDashboardCities(language: string): Promise<any[]> {
 
   const citiesId=["76ef53db-f690-4788-a71a-d15b67d632d8","7ca0cc4f-767a-40c7-beea-e981e3d80580","a1cbe96e-e576-4741-b8e6-767fa4024e96"]

    const cities = await knex("cities")
      .whereIn("cities.id", citiesId)
      .whereNull("cities.deleted_at")
      .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
      .where("city_pivots.language_code", language)
      .whereNull("city_pivots.deleted_at")
      .leftJoin("hotels", function() {
        this.on("hotels.location_id", "cities.id").andOnNull("hotels.deleted_at");
      })
      .leftJoin("tours", function() {
        this.on("tours.location_id", "cities.id").andOnNull("tours.deleted_at");
      })
      .leftJoin("activities", function() {
        this.on("activities.location_id", "cities.id").andOnNull("activities.deleted_at");
      })
      .leftJoin("visas", function() {
        this.on("visas.location_id", "cities.id").andOnNull("visas.deleted_at");
      })
      .leftJoin("car_rentals", function() {
        this.on("car_rentals.location_id", "cities.id").andOnNull("car_rentals.deleted_at");
      })
      .groupBy("cities.id", "cities.photo", "city_pivots.name")
      .select(
        "cities.id",
        "cities.photo",
        "city_pivots.name",
        knex.raw("COUNT(DISTINCT hotels.id) as hotels_count"),
        knex.raw("COUNT(DISTINCT tours.id) as tours_count"),
        knex.raw("COUNT(DISTINCT activities.id) as activities_count"),
        knex.raw("COUNT(DISTINCT visas.id) as visas_count"),
        knex.raw("COUNT(DISTINCT car_rentals.id) as car_rentals_count")
      )
      .limit(4);

      

    return cities;

  }

  getCitiesAndCountries(language: string): Promise<any[]> {
    return knex("cities")
      .whereNull("cities.deleted_at")
      .innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
      .where("city_pivots.language_code", language)
      .whereNull("city_pivots.deleted_at")
      .innerJoin("countries", "cities.country_id", "countries.id")
      .innerJoin("country_pivots", function() {
        this.on("countries.id", "country_pivots.country_id")
          .andOn("country_pivots.language_code", knex.raw("?", [language]))
          .andOnNull("country_pivots.deleted_at");
      })
      .select(
        "cities.id as id",
        "city_pivots.name as city_name",
        "country_pivots.name as country_name"
      );
  }
  
}

export default CityModel;
