import Joi from 'joi';

export const hotelGallerySchema = Joi.object({
  hotel_id: Joi.string().uuid().required(),
  category: Joi.string().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const hotelGalleryQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  hotel_id: Joi.string().uuid().optional(),
});

export const hotelGalleryBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const hotelGalleryUpdateSchema = Joi.object({
  hotel_id: Joi.string().uuid().optional(),
  category: Joi.string().optional(),
});
