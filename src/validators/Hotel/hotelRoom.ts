import Joi from 'joi';

export const hotelRoomSchema = Joi.object({
  hotel_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  refund_policy: Joi.string().required(),
  refund_days: Joi.number().optional(),
});

export const hotelRoomUpdateSchema = Joi.object({
  hotel_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  refund_policy: Joi.string().optional(),
  refund_days: Joi.number().optional(),
});

export const hotelRoomQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_id: Joi.string().uuid().optional(),
});
