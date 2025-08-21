import Joi from 'joi';

export const campaignSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  photo_url: Joi.string().required(),
  service_type: Joi.string().valid("hotel", "rental", "activity", "tour").required(),
  status: Joi.boolean().optional().default(true),
  highlight: Joi.boolean().optional().default(false),
});

export const campaignUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  photo_url: Joi.string().optional(),
  service_type: Joi.string().valid("hotel", "rental", "activity", "tour").optional(),
  status: Joi.boolean().optional(),
  highlight: Joi.boolean().optional(),
});



