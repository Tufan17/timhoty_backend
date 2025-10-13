import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class ActivityGalleryModel extends BaseModel {
	constructor() {
		super("activity_galleries")
	}
	static columns = ["id", "activity_id", "image_url", "image_type", "created_at", "updated_at", "deleted_at"]

	
	async hasCoverImage(activity_id: string) {
		return await knex("activity_gallery_pivots")
		  .join("activity_galleries", "activity_gallery_pivots.activity_gallery_id", "activity_galleries.id")
		  .where({
			"activity_galleries.activity_id": activity_id,
			"activity_gallery_pivots.category": "Kapak Resmi",
		  })
		  .whereNull("activity_galleries.deleted_at")
		  .whereNull("activity_gallery_pivots.deleted_at")
		  .first();
	  }
}

export default ActivityGalleryModel
