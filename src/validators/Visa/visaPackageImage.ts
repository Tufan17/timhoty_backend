import Joi from 'joi';

export const visaPackageImageSchema = Joi.object({
  visa_package_id: Joi.string().uuid().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const visaPackageImageUpdateSchema = Joi.object({
  visa_package_id: Joi.string().uuid().optional(),
  image_url: Joi.string().uri().optional(),
});

export const visaPackageImageQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  visa_package_id: Joi.string().uuid().optional(),
});

export const visaPackageImageBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
