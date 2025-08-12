import Joi from 'joi';

export const userNotificationSchema = Joi.object({
  notification_id: Joi.string().required(),
  target_type: Joi.string().required().valid("user", "dealer", "admin"),
  target_ids: Joi.array().items(Joi.string()).required(),
});
