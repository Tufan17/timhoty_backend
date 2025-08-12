import Joi from "joi";

export const feedbackSchema = Joi.object({
  user_id: Joi.string().required(),
  insurance_type_id: Joi.string().required(),
  message: Joi.string().required(),
  status: Joi.boolean().optional(),
});

export const feedbackUpdateSchema = Joi.object({
  status: Joi.boolean().optional(),
});
