import Joi from "joi"

export const activitySchema = Joi.object({
	location_id: Joi.string().uuid().required(),
	activity_type_id: Joi.string().uuid().required(),
	free_purchase: Joi.boolean().optional(),
	about_to_run_out: Joi.boolean().optional(),
	duration: Joi.string().required(),
	map_location: Joi.string().optional(),
	approval_period: Joi.number().optional(),
	highlight: Joi.boolean().optional(),
	title: Joi.string().required(),
	general_info: Joi.string().required(),
	activity_info: Joi.string().required(),
	refund_policy: Joi.string().required(),
})

export const activityUpdateSchema = Joi.object({
	location_id: Joi.string().uuid().optional(),
	activity_type_id: Joi.string().uuid().optional(),
	free_purchase: Joi.boolean().optional(),
	about_to_run_out: Joi.boolean().optional(),
	duration: Joi.string().optional(),
	map_location: Joi.string().optional(),
	approval_period: Joi.number().optional(),
	status: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	title: Joi.string().optional(),
	general_info: Joi.string().optional(),
	activity_info: Joi.string().optional(),
	refund_policy: Joi.string().optional(),
})

export const activityQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional().allow(""),
	location_id: Joi.string().uuid().optional(),
	activity_type_id: Joi.string().uuid().optional(),
	status: Joi.boolean().optional(),
	admin_approval: Joi.boolean().optional(),
	highlight: Joi.boolean().optional(),
	free_purchase: Joi.boolean().optional(),
	about_to_run_out: Joi.boolean().optional(),
})
