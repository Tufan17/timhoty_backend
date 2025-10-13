import Joi from "joi"

export const discountProductSchema = Joi.object({
	discount_code_id: Joi.string().required(),
	product_id: Joi.string().required(),
	service_type: Joi.string().valid("hotel", "car_rental", "activity", "tour", "visa").required(),
})

export const discountProductUpdateSchema = Joi.object({
	discount_code_id: Joi.string().optional(),
	product_id: Joi.string().optional(),
	service_type: Joi.string().valid("hotel", "car_rental", "activity", "tour", "visa").optional(),
})
