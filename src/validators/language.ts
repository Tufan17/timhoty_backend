import Joi from 'joi';

export const languageSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
});

export const languageUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
});



