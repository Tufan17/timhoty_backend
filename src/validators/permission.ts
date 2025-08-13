import Joi from 'joi';

export const permissionSchema = Joi.object({
  name: Joi.string().required(),
  target: Joi.string().required().valid("users", "admins","solution_partner","sale_partner"),
  target_id: Joi.string().required(),
  status: Joi.boolean().required(),
});

export const permissionUpdateSchema = Joi.object({
    status: Joi.boolean().required(),
    name: Joi.string().required(),
  });

export const permissionTotalSchema = Joi.object({
  permissions: Joi.array().items(permissionUpdateSchema).required(),
  target: Joi.string().required().valid("users", "admins","solution_partner","sale_partner"),
  user_id: Joi.string().required(),
});


