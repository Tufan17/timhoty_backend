import knex from "@/db/knex"
import BaseModel from "@/models/BaseModel"

class ActivityFeatureModel extends BaseModel {
	constructor() {
		super("activity_features")
	}

	static columns = ["id", "activity_id", "status", "created_at", "updated_at", "deleted_at"]

	async existFeature(data: { activity_id: string; name: string }) {
		const { activity_id, name } = data
		const feature = await knex("activity_features").whereNull("activity_features.deleted_at").leftJoin("activity_feature_pivots", "activity_features.id", "activity_feature_pivots.activity_feature_id").where("activity_id", activity_id).where("activity_feature_pivots.name", name).first()
		return !!feature
	}
}

export default ActivityFeatureModel
