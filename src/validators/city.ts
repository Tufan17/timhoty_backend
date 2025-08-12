import Joi from 'joi';

export const citySchema = Joi.object({
  name: Joi.string().required(),
  number_plate: Joi.number().required(),
});


export const cityUpdateSchema = Joi.object({
  name: Joi.string().required(),
  number_plate: Joi.number().required(),
});
