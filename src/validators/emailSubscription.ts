import Joi from 'joi';

export const emailSubscriptionSchema = Joi.object({
  language_code: Joi.string().required(),
  email: Joi.string().email().required(),
});

export const emailSubscriptionUpdateSchema = Joi.object({
  language_code: Joi.string().optional(),
  email: Joi.string().email().optional(),
  is_canceled: Joi.boolean().optional(),
});
