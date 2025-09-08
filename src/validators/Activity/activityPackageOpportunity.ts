import Joi from "joi"

export const activityPackageOpportunitySchema = Joi.object({
	activity_package_id: Joi.string().uuid().required(),
	name: Joi.string().required(),
})

export const activityPackageOpportunityUpdateSchema = Joi.object({
	activity_package_id: Joi.string().uuid().optional(),
	name: Joi.string().optional(),
})

export const activityPackageOpportunityQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	activity_package_id: Joi.string().uuid().optional(),
})
