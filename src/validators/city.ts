import Joi from 'joi';

export const citySchema = Joi.object({
  name: Joi.string().required(),
  country_id: Joi.string().required(),
  number_plate: Joi.string().optional(),
});

export const cityUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  country_id: Joi.string().optional(),
  number_plate: Joi.string().optional(),
});



