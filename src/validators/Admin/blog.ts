import Joi from 'joi';

export const blogSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  content: Joi.string().required(),
  imageUrl: Joi.string().required(),
  insurance_type_id: Joi.string().required(),
  status: Joi.string().required(),
});

export const blogUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  content: Joi.string().optional(),
  imageUrl: Joi.string().optional(),
  insurance_type_id: Joi.string().optional(),
  status: Joi.string().optional(),
});
