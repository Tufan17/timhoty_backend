import Joi from 'joi';

export const hotelRoomOpportunitySchema = Joi.object({
  hotel_room_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
});

export const hotelRoomOpportunityUpdateSchema = Joi.object({
  hotel_room_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
});

export const hotelRoomOpportunityQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_room_id: Joi.string().uuid().optional(),
});
