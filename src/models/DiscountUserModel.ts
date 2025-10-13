import BaseModel from "@/models/BaseModel"

class DiscountUserModel extends BaseModel {
	constructor() {
		super("discount_users")
	}

	static columns = ["id", "discount_code_id", "user_id", "created_at", "updated_at", "deleted_at"]
}

export default DiscountUserModel
