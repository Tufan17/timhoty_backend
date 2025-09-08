import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class ActivityPackagePriceModel extends BaseModel {
	constructor() {
		super("activity_package_prices")
	}
	static columns = ["id", "activity_package_id", "main_price", "child_price", "currency_id", "start_date", "end_date", "created_at", "updated_at", "deleted_at"]

	async deleteByActivityPackageId(activityPackageId: string) {
		await knex("activity_package_prices").where("activity_package_id", activityPackageId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async getPricesByActivityPackageId(activityPackageId: string) {
		return await knex("activity_package_prices").where("activity_package_id", activityPackageId).whereNull("deleted_at").orderBy("created_at", "desc")
	}
}

export default ActivityPackagePriceModel
