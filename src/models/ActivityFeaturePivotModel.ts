import BaseModel from "@/models/BaseModel"

class ActivityFeaturePivotModel extends BaseModel {
	constructor() {
		super("activity_feature_pivots")
	}
	static columns = ["id", "activity_feature_id", "name", "language_code", "created_at", "updated_at", "deleted_at"]
}

export default ActivityFeaturePivotModel
