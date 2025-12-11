import BaseModel from "@/models/BaseModel"

class IncludedExcludedModel extends BaseModel {
	constructor() {
		super("included_excluded")
	}
	static columns = ["id", "service_type", "type", "status", "created_at", "updated_at", "deleted_at"]
}

export default IncludedExcludedModel
