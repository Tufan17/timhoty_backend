import Joi from 'joi';

export const hotelRoomImageSchema = Joi.object({
  hotel_room_id: Joi.string().uuid().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const hotelRoomImageUpdateSchema = Joi.object({
  hotel_room_id: Joi.string().uuid().optional(),
  image_url: Joi.string().uri().optional(),
});

export const hotelRoomImageQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_room_id: Joi.string().uuid().optional(),
});

export const hotelRoomImageBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
