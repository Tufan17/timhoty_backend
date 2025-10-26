// src/validators/Visa/visaReservationUserFile.ts
import Joi from "joi"

export const visaReservationUserFileSchema = Joi.object({
	visa_reservation_id: Joi.string().uuid().required(),
	files: Joi.alternatives()
		.try(
			Joi.string(), // Single file
			Joi.array().items(Joi.string()) // Multiple files
		)
		.required(),
})

export const visaReservationUserFileQuerySchema = Joi.object({
	page: Joi.number().optional(),
	limit: Joi.number().optional(),
	visa_reservation_id: Joi.string().uuid().optional(),
})
