import BaseModel from "@/models/BaseModel"

class ActivityGalleryModel extends BaseModel {
	constructor() {
		super("activity_galleries")
	}
	static columns = ["id", "activity_id", "image_url", "image_type", "created_at", "updated_at", "deleted_at"]
}

export default ActivityGalleryModel
