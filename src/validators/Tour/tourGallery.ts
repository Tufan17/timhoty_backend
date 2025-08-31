import Joi from 'joi';

export const tourGallerySchema = Joi.object({
  tour_id: Joi.string().uuid().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const tourGalleryQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_id: Joi.string().uuid().optional(),
});

export const tourGalleryBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const tourGalleryUpdateSchema = Joi.object({
  tour_id: Joi.string().uuid().optional(),
  image_type: Joi.string().optional(),
  image_url: Joi.string().optional(),
});
