import BaseModel from "@/models/BaseModel"

class ActivityTypeModel extends BaseModel {
	constructor() {
		super("activity_types")
	}
	static columns = ["id", "status", "created_at", "updated_at", "deleted_at"]
}

export default ActivityTypeModel
