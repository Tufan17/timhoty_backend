import Joi from "joi"

export const faqSchema = Joi.object({
	title: Joi.string().required(),
	description: Joi.string().required(),
	order: Joi.string().required(),
	service_type: Joi.string().valid("hotel", "rental", "activity", "tour", "visa").optional().default("hotel"),
})

export const faqUpdateSchema = Joi.object({
	title: Joi.string().optional(),
	description: Joi.string().optional(),
	order: Joi.string().optional(),
	service_type: Joi.string().valid("hotel", "rental", "activity", "tour", "visa").optional(),
})
