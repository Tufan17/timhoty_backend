import Joi from 'joi';

export const frequentlyAskedQuestionSchema = Joi.object({
  order: Joi.number().required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  status: Joi.boolean().required(),
  insurance_type_id: Joi.string().required(),
});

export const frequentlyAskedQuestionUpdateSchema = Joi.object({
  order: Joi.number().optional(),
  title: Joi.string().optional(),
  content: Joi.string().optional(),
  status: Joi.boolean().optional(),
  insurance_type_id: Joi.string().optional(),
  type: Joi.string().optional(),
});
