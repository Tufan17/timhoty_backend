import Joi from 'joi';

export const carRentalPackageImageSchema = Joi.object({
  car_rental_package_id: Joi.string().uuid().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const carRentalPackageImageUpdateSchema = Joi.object({
  car_rental_package_id: Joi.string().uuid().optional(),
  image_url: Joi.string().uri().optional(),
});

export const carRentalPackageImageQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  car_rental_package_id: Joi.string().uuid().optional(),
});

export const carRentalPackageImageBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
