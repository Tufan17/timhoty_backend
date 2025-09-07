import Joi from "joi"

export const activityGallerySchema = Joi.object({
	activity_id: Joi.string().uuid().required(),
	category: Joi.string().required(),
	images: Joi.alternatives()
		.try(
			Joi.string(), // Single file
			Joi.array().items(Joi.string()) // Multiple files
		)
		.required(),
})

export const activityGalleryQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	activity_id: Joi.string().uuid().optional(),
})

export const activityGalleryBulkDeleteSchema = Joi.object({
	ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
})

export const activityGalleryUpdateSchema = Joi.object({
	activity_id: Joi.string().uuid().optional(),
	category: Joi.string().optional(),
	images: Joi.alternatives()
		.try(
			Joi.string(), // Single file
			Joi.array().items(Joi.string()) // Multiple files
		)
		.optional(),
})
