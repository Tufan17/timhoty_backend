import Joi from 'joi';

export const countrySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  phone_code: Joi.string().required(),
  timezone: Joi.string().required(),
  flag: Joi.string().required(),
  currency_id: Joi.string().uuid().optional().allow(null),
});

export const countryUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  phone_code: Joi.string().optional(),
  timezone: Joi.string().optional(),
  flag: Joi.string().optional(),
  currency_id: Joi.string().uuid().optional().allow(null),
});



