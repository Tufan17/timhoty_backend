import BaseModel from "@/models/BaseModel"

class ActivityPackageFeatureModel extends BaseModel {
	constructor() {
		super("activity_package_features")
	}

	static columns = ["id", "activity_package_id", "status", "created_at", "updated_at", "deleted_at"]
}

export default ActivityPackageFeatureModel
