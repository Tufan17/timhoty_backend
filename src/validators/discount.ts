import Joi from "joi"

export const discountCodeSchema = Joi.object({
	code: Joi.string().required(),
	service_type: Joi.string().valid("hotel", "car_rental", "activity", "tour", "visa").required(),
	amount: Joi.number().required(),
	percentage: Joi.number().required(),
	validity_period: Joi.date().required(),
})

export const discountCodeUpdateSchema = Joi.object({
	code: Joi.string().optional(),
	service_type: Joi.string().valid("hotel", "car_rental", "activity", "tour", "visa").optional(),
	amount: Joi.number().optional(),
	percentage: Joi.number().optional(),
	validity_period: Joi.date().optional(),
})
