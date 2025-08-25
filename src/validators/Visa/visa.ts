import Joi from 'joi';

export const visaSchema = Joi.object({
  // Visa table fields
  location_id: Joi.string().uuid().required(),
  refund_days: Joi.number().integer().min(0).optional(),
  approval_period: Joi.number().integer().min(0).optional(),
  // Visa pivot fields (translations)
  title: Joi.string().required(),
  general_info: Joi.string().required(),
  visa_info: Joi.string().required(),
  refund_policy: Joi.string().optional(),
});

export const visaUpdateSchema = Joi.object({
  // Visa table fields
  location_id: Joi.string().uuid().optional(),
  refund_days: Joi.number().integer().min(0).optional(),
  approval_period: Joi.number().integer().min(0).optional(),
  status: Joi.boolean().optional(),
  highlight: Joi.boolean().optional(),
  comment_count: Joi.number().integer().min(0).optional(),
  average_rating: Joi.number().min(0).max(5).optional(),
  
  // Visa pivot fields (translations)
  title: Joi.string().optional(),
  general_info: Joi.string().optional(),
  visa_info: Joi.string().optional(),
  refund_policy: Joi.string().optional(),
});

export const visaQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
  location_id: Joi.string().uuid().optional(),
  solution_partner_id: Joi.string().uuid().optional(),
  status: Joi.boolean().optional(),
  admin_approval: Joi.boolean().optional(),
  highlight: Joi.boolean().optional(),
});
