import BaseModel from "@/models/BaseModel"

class VisaPivotModel extends BaseModel {
	constructor() {
		super("visa_pivots")
	}
	static columns = ["id", "visa_id", "title", "general_info", "visa_info", "refund_policy", "language_code", "created_at", "updated_at", "deleted_at"]
}

export default VisaPivotModel
