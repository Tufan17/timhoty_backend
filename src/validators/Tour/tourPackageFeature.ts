import Joi from 'joi';

export const tourPackageFeatureSchema = Joi.object({
  tour_package_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const tourPackageFeatureUpdateSchema = Joi.object({
  tour_package_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const tourPackageFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_package_id: Joi.string().uuid().optional(),
});