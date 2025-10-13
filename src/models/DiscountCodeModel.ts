import BaseModel from "@/models/BaseModel"

class DiscountCodeModel extends BaseModel {
	constructor() {
		super("discount_codes")
	}

	static columns = [
		"id",
		"code",
		"service_type", // hotel, rental, activity, tour, visa
		"amount",
		"percentage",
		"validity_period",
		"created_at",
		"updated_at",
		"deleted_at",
	]
}

export default DiscountCodeModel
