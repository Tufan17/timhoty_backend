import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class TourGroupAskModel extends BaseModel {
	constructor() {
		super("tour_group_asks")
	}
	static columns = ["id", "name", "email", "phone", "user_count", "date", "tour_id", "message", "status", "answer", "user_id", "created_at", "updated_at", "deleted_at"]
}

export default TourGroupAskModel
