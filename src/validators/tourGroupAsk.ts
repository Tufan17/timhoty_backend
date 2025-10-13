import Joi from "joi"

export const tourGroupAskSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string().email().required(),
	phone: Joi.string().required(),
	user_count: Joi.string().required(),
	date: Joi.string().required(),
	tour_id: Joi.string().uuid().required(),
	message: Joi.string().required(),
})

export const tourGroupAskQuerySchema = Joi.object({
	page: Joi.number().default(1),
	limit: Joi.number().default(10),
	search: Joi.string().optional(),
	tour_id: Joi.string().uuid().optional(),
	status: Joi.boolean().optional(),
})
export const tourGroupAskUpdateSchema = Joi.object({
	status: Joi.boolean().optional(),
	answer: Joi.string().optional(),
}).min(1)
