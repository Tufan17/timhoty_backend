import Joi from 'joi';

export const tourProgramSchema = Joi.object({
  tour_id: Joi.string().uuid().required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  order: Joi.number().required(),
});

export const tourProgramUpdateSchema = Joi.object({
  tour_id: Joi.string().uuid().optional(),
  title: Joi.string().optional(),
  content: Joi.string().optional(),
  order: Joi.number().optional(),
});

export const tourProgramQuerySchema = Joi.object({
  page: Joi.number().optional(),
  limit: Joi.number().optional(),
  search: Joi.string().optional(),
  tour_id: Joi.string().uuid().optional(),
});