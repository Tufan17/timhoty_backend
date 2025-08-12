import Joi from "joi";

export const communicationPreferenceSchema = Joi.object({
  user_id: Joi.string().required(),
  email: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
  push: Joi.boolean().optional(),
});
