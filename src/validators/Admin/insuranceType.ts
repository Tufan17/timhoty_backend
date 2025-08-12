import Joi from 'joi';

export const insuranceTypeSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
});

export const insuranceTypeUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
});


