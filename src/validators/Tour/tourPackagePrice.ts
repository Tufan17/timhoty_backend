import Joi from "joi";

export const tourPackagePriceSchema = Joi.object({
  tour_package_id: Joi.string().uuid().required(),
  main_price: Joi.number().positive().required(),
  child_price: Joi.number().positive().optional().allow(null),
  baby_price: Joi.number().positive().optional().allow(null),
  currency_id: Joi.string().uuid().required(),
  start_date: Joi.date().iso().optional().allow(null),
  end_date: Joi.date().iso().optional().allow(null),
  period: Joi.string().optional().allow(null),
  date: Joi.date().iso().optional().allow(null),
  quota: Joi.number().integer().min(0).optional().allow(null),
});

export const tourPackagePriceUpdateSchema = Joi.object({
  tour_package_id: Joi.string().uuid().optional(),
  main_price: Joi.number().positive().optional(),
  child_price: Joi.number().positive().optional().allow(null),
  baby_price: Joi.number().positive().optional().allow(null),
  currency_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional().allow(null),
  end_date: Joi.date().iso().optional().allow(null),
  period: Joi.string().optional().allow(null),
  date: Joi.date().iso().optional().allow(null),
  quota: Joi.number().integer().min(0).optional().allow(null),
});

export const tourPackagePriceQuerySchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  tour_package_id: Joi.string().uuid().optional(),
});
