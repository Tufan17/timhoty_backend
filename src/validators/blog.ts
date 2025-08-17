import Joi from 'joi';

export const blogSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  photo_url: Joi.string().required(),
  service_type: Joi.string().required(),
  status: Joi.boolean().optional().default(true),
  highlight: Joi.boolean().optional().default(false),
});

export const blogUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  photo_url: Joi.string().optional(),
  service_type: Joi.string().optional(),
  status: Joi.boolean().optional(),
  highlight: Joi.boolean().optional(),
});



