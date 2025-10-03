import Joi from 'joi';

export const notificationSchema = Joi.object({
  service_type: Joi.string().required().valid("hotel", "rental", "activity", "tour"),
  type: Joi.string().required().valid("sms", "email", "push"),
  title: Joi.string().required(),
  description: Joi.string().required(),
});

export const notificationUpdateSchema = Joi.object({
  service_type: Joi.string().optional().valid("hotel", "rental", "activity", "tour"),
  type: Joi.string().optional().valid("sms", "email", "push"),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
});

export const assignNotificationSchema = Joi.object({
  notification_id: Joi.string().uuid().required(),
  target_type: Joi.string().required().valid("admin", "solution_partner_users", "sale_partner_users", "users"),
  target_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});
