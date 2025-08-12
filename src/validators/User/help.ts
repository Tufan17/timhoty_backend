import Joi from "joi";

export const helpSchema = Joi.object({
    insurance_type_id: Joi.string().required(),
    message: Joi.string().required(),
  });
  
  