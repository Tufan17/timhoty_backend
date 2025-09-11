import Joi from "joi"

export const activityPackageHourSchema = Joi.object({
	activity_package_id: Joi.string().uuid().required(),
	hour: Joi.number().integer().min(0).max(23).required(),
	minute: Joi.number().integer().min(0).max(59).required(),
})

export const activityPackageHourUpdateSchema = Joi.object({
	activity_package_id: Joi.string().uuid().optional(),
	hour: Joi.number().integer().min(0).max(23).optional(),
	minute: Joi.number().integer().min(0).max(59).optional(),
})

export const activityPackageHourQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	activity_package_id: Joi.string().uuid().optional(),
})
