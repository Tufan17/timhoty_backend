import Joi from 'joi';

export const contractSchema = Joi.object({
  key: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
});

export const contractUpdateSchema = Joi.object({
  key: Joi.string().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
});



