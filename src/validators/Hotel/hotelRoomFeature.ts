import Joi from 'joi';

export const hotelRoomFeatureSchema = Joi.object({
  hotel_room_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const hotelRoomFeatureUpdateSchema = Joi.object({
  hotel_room_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const hotelRoomFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_room_id: Joi.string().uuid().optional(),
});