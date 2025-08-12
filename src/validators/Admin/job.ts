import Joi from 'joi';

export const jobSchema = Joi.object({
  name: Joi.string().required(),
});

export const jobUpdateSchema = Joi.object({
  name: Joi.string().optional(),
});