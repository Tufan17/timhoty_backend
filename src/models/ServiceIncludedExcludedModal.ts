import BaseModel from "@/models/BaseModel"

class ServiceIncludedExcludedModel extends BaseModel {
	constructor() {
		super("services_included_excluded")
	}
	static columns = ["id", "included_excluded_id", "service_id", "type", "service_type", "created_at", "updated_at", "deleted_at"]
}

export default ServiceIncludedExcludedModel
