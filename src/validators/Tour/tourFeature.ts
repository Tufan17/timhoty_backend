import Joi from 'joi';

export const tourFeatureSchema = Joi.object({
  tour_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const tourFeatureUpdateSchema = Joi.object({
  tour_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const tourFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_id: Joi.string().uuid().optional(),
});