import Joi from "joi"

export const tourSchema = Joi.object({
	night_count: Joi.number().integer().min(0).required(),
	day_count: Joi.number().integer().min(0).required(),
	refund_days: Joi.number().integer().min(0).required(),
	user_count: Joi.number().integer().min(0).optional(),
	comment_count: Joi.number().integer().min(0).optional(),
	average_rating: Joi.number().min(0).max(5).optional(),
	title: Joi.string().required(),
	general_info: Joi.string().required(),
	tour_info: Joi.string().required(),
	refund_policy: Joi.string().optional(),
})

export const tourUpdateSchema = Joi.object({
	night_count: Joi.number().integer().min(0).optional(),
	day_count: Joi.number().integer().min(0).optional(),
	refund_days: Joi.number().integer().min(0).optional(),
	user_count: Joi.number().integer().min(0).optional(),
	comment_count: Joi.number().integer().min(0).optional(),
	average_rating: Joi.number().min(0).max(5).optional(),
	status: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	title: Joi.string().optional(),
	general_info: Joi.string().optional(),
	tour_info: Joi.string().optional(),
	refund_policy: Joi.string().optional(),
})

export const tourQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	search: Joi.string().allow("").optional(),
	solution_partner_id: Joi.string().uuid().optional(),
	status: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
})
