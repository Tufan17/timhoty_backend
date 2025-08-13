import Joi from 'joi';

export const adminSchema = Joi.object({
  name_surname: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  phone: Joi.string().required(),
  language: Joi.string().required(),
});

export const adminUpdateSchema = Joi.object({
  name_surname: Joi.string().optional(),
  password: Joi.string().optional(),
  phone: Joi.string().optional(),
  language: Joi.string().optional(),
  status: Joi.boolean().optional(),
});