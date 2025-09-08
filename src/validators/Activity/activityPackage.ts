import Joi from "joi"

const priceSchemata = Joi.object({
	main_price: Joi.number().positive().required(),
	child_price: Joi.number().positive().optional(),
	currency_id: Joi.string().uuid().required(),
	start_date: Joi.date().iso().optional().allow(null),
	end_date: Joi.date().iso().optional().allow(null),
})

export const activityPackageSchema = Joi.object({
	activity_id: Joi.string().uuid().required(),
	discount: Joi.number().min(0).max(100).optional(),
	total_tax_amount: Joi.number().min(0).optional(),
	constant_price: Joi.boolean().required(),
	name: Joi.string().required(),
	description: Joi.string().required(),
	refund_policy: Joi.string().required(),
	return_acceptance_period: Joi.number().required(),
	date: Joi.date().iso().required(),
	prices: Joi.array().items(priceSchemata).min(1).required(),
})

export const activityPackageUpdateSchema = Joi.object({
	discount: Joi.number().min(0).max(100).optional(),
	total_tax_amount: Joi.number().min(0).optional(),
	constant_price: Joi.boolean().optional(),
	return_acceptance_period: Joi.number().optional(),
	name: Joi.string().optional(),
	description: Joi.string().optional(),
	refund_policy: Joi.string().optional(),
	date: Joi.date().iso().optional(),
	prices: Joi.array().items(priceSchemata).min(1).optional(),
})

export const activityPackageQuerySchema = Joi.object({
	page: Joi.number().min(1).optional(),
	limit: Joi.number().min(1).max(100).optional(),
	search: Joi.string().optional(),
	activity_id: Joi.string().uuid().optional(),
})

export const activityPackageHourSchema = Joi.object({
	activity_package_id: Joi.string().uuid().required(),
	hour: Joi.number().required(),
	minute: Joi.number().required(),
})
