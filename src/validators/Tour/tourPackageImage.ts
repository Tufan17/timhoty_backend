import Joi from 'joi';

export const tourPackageImageSchema = Joi.object({
  tour_package_id: Joi.string().uuid().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const tourPackageImageUpdateSchema = Joi.object({
  tour_package_id: Joi.string().uuid().optional(),
  image_url: Joi.string().uri().optional(),
});

export const tourPackageImageQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_package_id: Joi.string().uuid().optional(),
});

export const tourPackageImageBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
