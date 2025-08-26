import Joi from 'joi';

export const visaFeatureSchema = Joi.object({
  visa_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const visaFeatureUpdateSchema = Joi.object({
  visa_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const visaFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  visa_id: Joi.string().uuid().optional(),
});