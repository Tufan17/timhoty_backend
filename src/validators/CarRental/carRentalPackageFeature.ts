import Joi from 'joi';

export const carRentalPackageFeatureSchema = Joi.object({
  car_rental_package_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const carRentalPackageFeatureUpdateSchema = Joi.object({
  car_rental_package_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const carRentalPackageFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  car_rental_package_id: Joi.string().uuid().optional(),
});