import Joi from 'joi';

export const visaGallerySchema = Joi.object({
  visa_id: Joi.string().uuid().required(),
  category: Joi.string().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const visaGalleryQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  visa_id: Joi.string().uuid().optional(),
});

export const visaGalleryBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const visaGalleryUpdateSchema = Joi.object({
  visa_id: Joi.string().uuid().optional(),
  category: Joi.string().optional(),
});
