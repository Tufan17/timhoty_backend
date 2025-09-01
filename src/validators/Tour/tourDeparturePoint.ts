import Joi from 'joi';

export const tourDeparturePointSchema = Joi.object({
  tour_id: Joi.string().uuid().required(),
  location_id: Joi.string().uuid().required(),
});

export const tourDeparturePointUpdateSchema = Joi.object({
  tour_id: Joi.string().uuid().optional(),
  location_id: Joi.string().uuid().optional(),
});

export const tourDeparturePointQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_id: Joi.string().uuid().optional(),
});