import Joi from 'joi';

export const tourPackageOpportunitySchema = Joi.object({
  tour_package_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
});

export const tourPackageOpportunityUpdateSchema = Joi.object({
  tour_package_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
});

export const tourPackageOpportunityQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_package_id: Joi.string().uuid().optional(),
});
