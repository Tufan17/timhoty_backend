import Joi from "joi"

export const userSchema = Joi.object({
	name_surname: Joi.string().required(),
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	phone: Joi.string().optional(),
	language: Joi.string().required(),
	birthday: Joi.date().optional(),
	email_verified: Joi.boolean().optional(),
	status: Joi.boolean().optional().default(true),
	sms_contact: Joi.boolean().optional(),
	email_contact: Joi.boolean().optional(),
	push_contact: Joi.boolean().optional(),
	electronic_contact_permission: Joi.boolean().optional(),
	currency_id: Joi.string().optional(),
	device_id: Joi.string().optional(),
	verification_code: Joi.string().optional(),
	verification_code_expires_at: Joi.date().optional(),
	avatar: Joi.any().optional(),
})

export const userUpdateSchema = Joi.object({
	name_surname: Joi.string().optional(),
	password: Joi.string().optional(),
	phone: Joi.string().optional(),
	language: Joi.string().optional(),
	status: Joi.boolean().optional().default(true),
	sms_contact: Joi.boolean().optional(),
	email_contact: Joi.boolean().optional(),
	push_contact: Joi.boolean().optional(),
	electronic_contact_permission: Joi.boolean().optional(),
	currency_id: Joi.string().optional(),
	device_id: Joi.string().optional(),
	verification_code: Joi.string().optional(),
	verification_code_expires_at: Joi.date().optional(),
	avatar: Joi.any().optional(),
})
export const avatarUpdateSchema = Joi.object({
	avatar: Joi.string().optional(),
})
