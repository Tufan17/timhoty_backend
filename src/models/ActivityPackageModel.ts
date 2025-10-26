import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class ActivityPackageModel extends BaseModel {
	constructor() {
		super("activity_packages")
	}
	static columns = ["id", "activity_id", "return_acceptance_period", "discount", "total_tax_amount", "constant_price", "start_date", "end_date", "created_at", "updated_at", "deleted_at"]

	async deleteByActivityId(activityId: string) {
		await knex("activity_packages").where("activity_id", activityId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async getPackagesByActivityId(activityId: string) {
		return await knex("activity_packages").select("activity_packages.*", "activities.*").join("activities", "activity_packages.activity_id", "activities.id").where("activity_packages.activity_id", activityId).whereNull("activity_packages.deleted_at").whereNull("activities.deleted_at").orderBy("activity_packages.start_date", "asc")
	}

	async getPackagesByDateRange(startDate: string, endDate: string) {
		return await knex("activity_packages").select("activity_packages.*", "activities.*").join("activities", "activity_packages.activity_id", "activities.id").whereBetween("activity_packages.start_date", [startDate, endDate]).whereNull("activity_packages.deleted_at").whereNull("activities.deleted_at").orderBy("activity_packages.start_date", "asc")
	}

	async getPackagesWithDiscount() {
		return await knex("activity_packages").select("activity_packages.*", "activities.*").join("activities", "activity_packages.activity_id", "activities.id").where("activity_packages.discount", ">", 0).whereNull("activity_packages.deleted_at").whereNull("activities.deleted_at").orderBy("activity_packages.discount", "desc")
	}

	async getConstantPricePackages() {
		return await knex("activity_packages").select("activity_packages.*", "activities.*").join("activities", "activity_packages.activity_id", "activities.id").where("activity_packages.constant_price", true).whereNull("activity_packages.deleted_at").whereNull("activities.deleted_at").orderBy("activity_packages.created_at", "desc")
	}
}

export default ActivityPackageModel
