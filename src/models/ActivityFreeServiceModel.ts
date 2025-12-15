import BaseModel from "@/models/BaseModel"

class ActivityFreeServiceModel extends BaseModel {
	constructor() {
		super("activity_free_service")
	}
	static columns = ["id", "activity_reservation_id", "user_id", "activity_id", "lat", "lng", "address", "address_name", "created_at", "updated_at", "deleted_at"]
}

export default ActivityFreeServiceModel
