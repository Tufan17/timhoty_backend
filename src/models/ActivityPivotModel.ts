import BaseModel from "@/models/BaseModel"

class ActivityPivotModel extends BaseModel {
	constructor() {
		super("activity_pivots")
	}
	static columns = ["id", "activity_id", "title", "general_info", "activity_info", "refund_policy", "language_code", "created_at", "updated_at", "deleted_at"]
}

export default ActivityPivotModel
