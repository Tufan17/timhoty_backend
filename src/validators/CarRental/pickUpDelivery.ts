import Joi from 'joi';

export const pickUpDeliverySchema = Joi.object({
  car_rental_id: Joi.string().uuid().required(),
  station_id: Joi.string().uuid().required(),
  status: Joi.boolean().required(),
});

export const pickUpDeliveryQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  car_rental_id: Joi.string().uuid().optional(),
});

export const pickUpDeliveryBulkDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const pickUpDeliveryUpdateSchema = Joi.object({
  car_rental_id: Joi.string().uuid().optional(),
  station_id: Joi.string().uuid().optional(),
  status: Joi.boolean().optional(),
});
