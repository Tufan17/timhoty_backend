import Joi from 'joi';

export const permissionSchema = Joi.object({
  name: Joi.string().required(),
  target: Joi.string().required().valid("users", "dealer_users", "admins"),
  target_id: Joi.string().required(),
  status: Joi.boolean().required(),
});

export const permissionUpdateSchema = Joi.object({
    status: Joi.boolean().required(),
    name: Joi.string().required(),
  });

export const permissionTotalSchema = Joi.object({
  permissions: Joi.array().items(permissionUpdateSchema).required(),
  target: Joi.string().required().valid("users", "dealer_users", "admins"),
  user_id: Joi.string().required(),
});


export const dealerPermissionTotalSchema = Joi.object({
  permissions: Joi.array().items(permissionUpdateSchema).required(),
  user_id: Joi.string().required(),
});

