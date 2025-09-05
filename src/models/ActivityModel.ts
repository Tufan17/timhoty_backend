import BaseModel from "@/models/BaseModel"

class ActivityModel extends BaseModel {
	constructor() {
		super("activities")
	}
	static columns = ["id", "location_id", "solution_partner_id", "status", "highlight", "admin_approval", "activity_type_id", "free_purchase", "about_to_run_out", "duration", "map_location", "approval_period", "comment_count", "average_rating", "created_at", "updated_at", "deleted_at"]
}

export default ActivityModel
