import Joi from 'joi';

export const tourLocationSchema = Joi.object({
  tour_id: Joi.string().uuid().required(),
  location_id: Joi.string().uuid().required(),
});

export const tourLocationUpdateSchema = Joi.object({
  tour_id: Joi.string().uuid().optional(),
  location_id: Joi.string().uuid().optional(),
});

export const tourLocationQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_id: Joi.string().uuid().optional(),
});