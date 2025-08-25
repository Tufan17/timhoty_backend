import Joi from 'joi';

export const visaSchema = Joi.object({
  solution_partner_id: Joi.string().uuid().required(),
  country_id: Joi.string().uuid().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  duration: Joi.number().required(),
  duration_type: Joi.string().valid('day', 'month', 'year').required(),
  status: Joi.boolean().default(true),
  translations: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
    })
  ).required(),
});

export const visaUpdateSchema = Joi.object({
  country_id: Joi.string().uuid().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional(),
  currency_id: Joi.string().uuid().optional(),
  duration: Joi.number().optional(),
  duration_type: Joi.string().valid('day', 'month', 'year').optional(),
  status: Joi.boolean().optional(),
  translations: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
    })
  ).optional(),
});

export const visaQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  solution_partner_id: Joi.string().uuid().optional(),
  country_id: Joi.string().uuid().optional(),
  status: Joi.boolean().optional(),
});
