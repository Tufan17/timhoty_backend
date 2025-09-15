import Joi from "joi"

export const hotelSchema = Joi.object({
	location_id: Joi.string().uuid().required(),
	pool: Joi.boolean().optional(),
	private_beach: Joi.boolean().optional(),
	transfer: Joi.boolean().optional(),
	map_location: Joi.string().optional(),
	free_age_limit: Joi.number().optional(),
	highlight: Joi.boolean().optional(),
	refund_days: Joi.number().optional(),
	name: Joi.string().required(),
	general_info: Joi.string().required(),
	hotel_info: Joi.string().required(),
	refund_policy: Joi.string().required(),
})

export const hotelUpdateSchema = Joi.object({
	location_id: Joi.string().optional(),
	pool: Joi.boolean().optional(),
	private_beach: Joi.boolean().optional(),
	transfer: Joi.boolean().optional(),
	map_location: Joi.string().optional(),
	free_age_limit: Joi.number().optional(),
	status: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
	refund_days: Joi.number().optional(),
	name: Joi.string().optional(),
	general_info: Joi.string().optional(),
	hotel_info: Joi.string().optional(),
	refund_policy: Joi.string().optional(),
})

export const hotelQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional().allow(""),
	location_id: Joi.string().uuid().optional(),
	status: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	highlight: Joi.boolean().optional().default(false),
})
