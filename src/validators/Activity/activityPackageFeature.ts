import Joi from "joi"

export const activityPackageFeatureSchema = Joi.object({
	activity_package_id: Joi.string().uuid().required(),
	name: Joi.string().required(),
	status: Joi.boolean().optional(),
})

export const activityPackageFeatureUpdateSchema = Joi.object({
	activity_package_id: Joi.string().uuid().optional(),
	name: Joi.string().optional(),
	status: Joi.boolean().optional(),
})

export const activityPackageFeatureQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	activity_package_id: Joi.string().uuid().optional(),
})
