import BaseModel from "@/models/BaseModel"

class ActivityPackageFeaturePivotModel extends BaseModel {
	constructor() {
		super("activity_package_feature_pivots")
	}

	static columns = ["id", "activity_package_feature_id", "language_code", "name", "created_at", "updated_at", "deleted_at"]
}

export default ActivityPackageFeaturePivotModel
