import BaseModel from "@/models/BaseModel"

class ActivityPackageImageModel extends BaseModel {
	constructor() {
		super("activity_package_images")
	}

	static columns = ["id", "activity_package_id", "image_url", "created_at", "updated_at", "deleted_at"]

	async getByActivityPackageId(activityPackageId: string): Promise<any[]> {
		return this.where("activity_package_id", activityPackageId)
	}

	async deleteByActivityPackageId(activityPackageId: string): Promise<number> {
		const images = await this.where("activity_package_id", activityPackageId)
		let deletedCount = 0

		for (const image of images) {
			await this.delete(image.id)
			deletedCount++
		}

		return deletedCount
	}
}

export default ActivityPackageImageModel
