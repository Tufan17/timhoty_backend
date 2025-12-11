import Joi from "joi"

export const includedExcludedSchema = Joi.object({
	name: Joi.string().required(),
	service_type: Joi.string().valid("hotel", "rental", "activity", "tour", "visa").optional().default("hotel"),
	type: Joi.string().valid("normal", "package").required(),
	status: Joi.boolean().required(),
})
export const includedExcludedCreateSchema = Joi.object({
	service_id: Joi.string().required(),
	service_type: Joi.string().valid("hotel", "rental", "activity", "tour", "visa").optional().default("hotel"),
	type: Joi.string().valid("normal", "package").required(),
	included_excluded_ids: Joi.array()
		.items(
			Joi.object({
				id: Joi.string().required(),
				status: Joi.boolean().required(),
			})
		)
		.required(),
})

export const includedExcludedUpdateSchema = Joi.object({
	name: Joi.string().optional(),
	service_type: Joi.string().valid("hotel", "rental", "activity", "tour", "visa").optional(),
	type: Joi.string().valid("normal", "package").optional(),
	status: Joi.boolean().optional(),
})
