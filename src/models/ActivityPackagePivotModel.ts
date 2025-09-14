import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class ActivityPackagePivotModel extends BaseModel {
	constructor() {
		super("activity_package_pivots")
	}
	static columns = ["id", "activity_package_id", "language_code", "name", "description", "refund_policy", "created_at", "updated_at", "deleted_at"]

	async deleteByActivityPackageId(activityPackageId: string) {
		await knex("activity_package_pivots").where("activity_package_id", activityPackageId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async getPivotsByActivityPackageId(activityPackageId: string) {
		return await knex("activity_package_pivots").where("activity_package_id", activityPackageId).whereNull("deleted_at").orderBy("language_code", "asc")
	}

	async getPivotsByLanguage(languageCode: string) {
		return await knex("activity_package_pivots").where("language_code", languageCode).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getPivotsWithActivityPackage(activityPackageId: string, languageCode: string) {
		return await knex("activity_package_pivots").select("activity_package_pivots.*", "activity_packages.*").join("activity_packages", "activity_package_pivots.activity_package_id", "activity_packages.id").where("activity_package_pivots.activity_package_id", activityPackageId).where("activity_package_pivots.language_code", languageCode).whereNull("activity_package_pivots.deleted_at").whereNull("activity_packages.deleted_at").first()
	}
}

export default ActivityPackagePivotModel
