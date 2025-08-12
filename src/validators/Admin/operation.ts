import Joi from 'joi';

export const operationSchema = Joi.object({
  user_id: Joi.string().required(),
  insurance_type_id: Joi.string().required(),
  content: Joi.string().required(),
});

export const jobUpdateSchema = Joi.object({
  name: Joi.string().optional(),
});