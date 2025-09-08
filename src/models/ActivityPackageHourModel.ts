import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class ActivityPackageHourModel extends BaseModel {
	constructor() {
		super("activity_package_hours")
	}
	static columns = ["id", "activity_package_id", "hour", "minute", "created_at", "updated_at", "deleted_at"]

	async deleteByActivityPackageId(activityPackageId: string) {
		await knex("activity_package_hours").where("activity_package_id", activityPackageId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async getHoursByActivityPackageId(activityPackageId: string) {
		return await knex("activity_package_hours").where("activity_package_id", activityPackageId).whereNull("deleted_at").orderBy("created_at", "desc")
	}
}

export default ActivityPackageHourModel
