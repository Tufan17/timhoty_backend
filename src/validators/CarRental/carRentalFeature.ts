import Joi from 'joi';

export const carRentalFeatureSchema = Joi.object({
  car_rental_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const carRentalFeatureUpdateSchema = Joi.object({
  car_rental_id: Joi.string().uuid().optional(),
  name: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const carRentalFeatureQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  car_rental_id: Joi.string().uuid().optional(),
});