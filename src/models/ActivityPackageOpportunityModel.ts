import knex from "@/db/knex"
import BaseModel from "@/models/BaseModel"

class ActivityPackageOpportunityModel extends BaseModel {
	constructor() {
		super("activity_package_opportunities")
	}
	static columns = ["id", "activity_package_id", "created_at", "updated_at", "deleted_at"]
	async existOpportunity(data: { activity_package_id: string; name: string }) {
		const { activity_package_id, name } = data
		const opportunity = await knex("activity_package_opportunities").whereNull("activity_package_opportunities.deleted_at").leftJoin("activity_package_opportunity_pivots", "activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id").where("activity_package_id", activity_package_id).where("activity_package_opportunity_pivots.name", name).first()
		return !!opportunity
	}
}

export default ActivityPackageOpportunityModel
