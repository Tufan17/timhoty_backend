import Joi from "joi"

export const carRentalSchema = Joi.object({
	location_id: Joi.string().uuid().required(),
	car_type_id: Joi.string().uuid().required(),
	gear_type_id: Joi.string().uuid().required(),
	user_count: Joi.number().integer().min(0).optional(),
	door_count: Joi.number().integer().min(0).optional(),
	age_limit: Joi.number().integer().min(0).optional(),
	air_conditioning: Joi.boolean().required(),
	about_to_run_out: Joi.boolean().required(),
	comment_count: Joi.number().integer().min(0).optional(),
	average_rating: Joi.number().min(0).max(5).optional(),
	title: Joi.string().required(),
	general_info: Joi.string().required(),
	car_info: Joi.string().required(),
	refund_policy: Joi.string().optional(),
})

export const carRentalUpdateSchema = Joi.object({
	location_id: Joi.string().uuid().optional(),
	solution_partner_id: Joi.string().uuid().optional(),
	car_type_id: Joi.string().uuid().optional(),
	gear_type_id: Joi.string().uuid().optional(),
	user_count: Joi.number().integer().min(0).optional(),
	door_count: Joi.number().integer().min(0).optional(),
	age_limit: Joi.number().integer().min(0).optional(),
	air_conditioning: Joi.boolean().optional(),
	about_to_run_out: Joi.boolean().optional(),
	comment_count: Joi.number().integer().min(0).optional(),
	average_rating: Joi.number().min(0).max(5).optional(),
	status: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	title: Joi.string().optional(),
	general_info: Joi.string().optional(),
	car_info: Joi.string().optional(),
	refund_policy: Joi.string().optional(),
})

export const carRentalQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	search: Joi.string().optional().allow(""),
	location_id: Joi.string().uuid().optional(),
	solution_partner_id: Joi.string().uuid().optional(),
	status: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
})
