import Joi from 'joi';

export const hotelOpportunitySchema = Joi.object({
  hotel_id: Joi.string().uuid().required(),
  category: Joi.string().required(),
  description: Joi.string().required(),
});

export const hotelOpportunityUpdateSchema = Joi.object({
  hotel_id: Joi.string().uuid().optional(),
  category: Joi.string().optional(),
  description: Joi.string().optional(),
});

export const hotelOpportunityQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_id: Joi.string().uuid().optional(),
});
