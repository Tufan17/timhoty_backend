import Joi from 'joi';

export const hotelFeatureSchema = Joi.object({
  hotel_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const hotelFeatureUpdateSchema = Joi.object({
  hotel_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const hotelFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_id: Joi.string().uuid().optional(),
});