import BaseModel from "@/models/BaseModel"

class ActivityTypePivotModel extends BaseModel {
	constructor() {
		super("activities_type_pivots")
	}
	static columns = ["id", "activity_type_id", "language_code", "name", "created_at", "updated_at", "deleted_at"]
}

export default ActivityTypePivotModel
