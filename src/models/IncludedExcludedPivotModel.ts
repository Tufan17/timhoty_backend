import BaseModel from "@/models/BaseModel"

class IncludedExcludedPivotModel extends BaseModel {
	constructor() {
		super("included_excluded_pivot")
	}
	static columns = ["id", "included_excluded_id", "language_code", "name", "created_at", "updated_at", "deleted_at"]
}

export default IncludedExcludedPivotModel
