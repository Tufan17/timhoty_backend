import BaseModel from "@/models/BaseModel"

class ActivityGalleryPivotModel extends BaseModel {
	constructor() {
		super("activity_gallery_pivots")
	}
	static columns = ["id", "activity_gallery_id", "category", "language_code", "created_at", "updated_at", "deleted_at"]
}

export default ActivityGalleryPivotModel
