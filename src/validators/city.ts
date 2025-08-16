import Joi from 'joi';

export const citySchema = Joi.object({
  name: Joi.string().required(),
  country_id: Joi.string().required(),
  photo: Joi.string().optional(),
  number_plate: Joi.string().optional(),
});

export const cityUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  country_id: Joi.string().optional(),
  photo: Joi.string().optional(),
  number_plate: Joi.string().optional(),
});

export const cityQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).default(10),
  search: Joi.string().allow('').default(''),
  country_id: Joi.string().uuid().allow(null).optional(),
});


