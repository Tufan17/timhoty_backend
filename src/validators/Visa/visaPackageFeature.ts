import Joi from 'joi';

export const visaPackageFeatureSchema = Joi.object({
  visa_package_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const visaPackageFeatureUpdateSchema = Joi.object({
  visa_package_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const visaPackageFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  visa_package_id: Joi.string().uuid().optional(),
});