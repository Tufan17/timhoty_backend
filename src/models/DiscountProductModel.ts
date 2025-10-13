import BaseModel from "@/models/BaseModel"

class DiscountProductModel extends BaseModel {
	constructor() {
		super("discount_products")
	}

	static columns = ["id", "discount_code_id", "product_id", "service_type", "created_at", "updated_at", "deleted_at"]
}

export default DiscountProductModel
