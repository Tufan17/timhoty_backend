import Joi from 'joi';

export const carRentalGallerySchema = Joi.object({
  car_rental_id: Joi.string().uuid().required(),
  category: Joi.string().required(),
  images: Joi.alternatives().try(
    Joi.string(), // Single file
    Joi.array().items(Joi.string()) // Multiple files
  ).required(),
});

export const carRentalGalleryQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  car_rental_id: Joi.string().uuid().optional(),
});

export const carRentalGalleryBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const carRentalGalleryUpdateSchema = Joi.object({
  car_rental_id: Joi.string().uuid().optional(),
  category: Joi.string().optional(),
});
