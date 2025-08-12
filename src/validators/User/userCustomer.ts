import Joi from "joi";

export const userCustomerUpdateSchema = Joi.object({
    name_surname: Joi.string().optional(),
    job_id: Joi.string().optional(),
    email: Joi.string().email().optional()
  });