import Joi from 'joi';

export const userGuideSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  order: Joi.string().required(),
});

export const userGuideUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  order: Joi.string().optional(),
});



