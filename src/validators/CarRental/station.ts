import Joi from "joi"

export const stationSchema = Joi.object({
	location_id: Joi.string().uuid().required(),
	map_location: Joi.string().required(),
	name: Joi.string().required(),
})

export const stationUpdateSchema = Joi.object({
	location_id: Joi.string().uuid().optional(),
	map_location: Joi.string().optional(),
	name: Joi.string().optional(),
	status: Joi.boolean().optional(),
})

export const stationQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	search: Joi.string().optional().allow(""),
	location_id: Joi.string().uuid().optional(),
	status: Joi.boolean().optional(),
})
