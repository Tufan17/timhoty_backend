import knex from "@/db/knex"
import BaseModel from "@/models/BaseModel"

class CountryModel extends BaseModel {
	constructor() {
		super("countries")
	}
	static columns = ["id", "code", "phone_code", "timezone", "flag", "currency_id", "created_at", "updated_at", "deleted_at"]

	getCountries(language: string): Promise<any[]> {
		return knex("countries").whereNull("countries.deleted_at").innerJoin("country_pivots", "countries.id", "country_pivots.country_id").where("country_pivots.language_code", language).whereNull("country_pivots.deleted_at").select("countries.*", "country_pivots.name as name")
	}
}

export default CountryModel
