import Joi from "joi"

export const activityPackageImageSchema = Joi.object({
	activity_package_id: Joi.string().uuid().required(),
	images: Joi.alternatives()
		.try(
			Joi.string(), // Single file
			Joi.array().items(Joi.string()) // Multiple files
		)
		.required(),
})

export const activityPackageImageUpdateSchema = Joi.object({
	activity_package_id: Joi.string().uuid().optional(),
	image_url: Joi.string().uri().optional(),
})

export const activityPackageImageQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	search: Joi.string().optional(),
	activity_package_id: Joi.string().uuid().optional(),
})

export const activityPackageImageBulkDeleteSchema = Joi.object({
	ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
})
