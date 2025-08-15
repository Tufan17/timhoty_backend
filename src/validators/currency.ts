import Joi from 'joi';

export const currencySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  symbol: Joi.string().required(),
  position: Joi.string().required(),
  is_active: Joi.boolean().required(),
});

export const currencyUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  symbol: Joi.string().optional(),
  position: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
});



