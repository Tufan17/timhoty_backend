import Joi from "joi"

export const activityFeatureSchema = Joi.object({
	activity_id: Joi.string().uuid().required(),
	name: Joi.string().required(),
	status: Joi.boolean().optional(),
})

export const activityFeatureUpdateSchema = Joi.object({
	activity_id: Joi.string().uuid().optional(),
	name: Joi.string().optional(),
	status: Joi.boolean().optional(),
})

export const activityFeatureQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	activity_id: Joi.string().uuid().optional(),
})
