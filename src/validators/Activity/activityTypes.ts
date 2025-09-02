import Joi from "joi"

export const activityTypeSchema = Joi.object({
	name: Joi.string().required(),
	status: Joi.boolean().optional().default(true),
})

export const activityTypeUpdateSchema = Joi.object({
	name: Joi.string().optional(),
	status: Joi.boolean().optional(),
})

export const activityTypeQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	status: Joi.boolean().optional(),
})
