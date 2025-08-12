import Joi from 'joi';

export const dealerSchema = Joi.object({
  name: Joi.string().required(),
  city_id: Joi.string().required(),
  district_id: Joi.string().required(),
  address: Joi.string().required(),
  phone: Joi.string().required(),
  status: Joi.boolean().required(),
  verify: Joi.boolean().required(),
  tax_office: Joi.string().allow('').optional(),
  tax_number: Joi.string().optional(),
  bank_account_iban: Joi.string().allow('').optional(),
  bank_account_name: Joi.string().allow('').optional(),
  type: Joi.string().required(),
});

export const dealerUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  city_id: Joi.string().optional(),
  district_id: Joi.string().optional(),
  phone: Joi.string().optional(),
  status: Joi.boolean().optional(),
  address: Joi.string().optional(),
  verify: Joi.boolean().optional(),
  tax_office: Joi.string().allow('').optional(),
  tax_number: Joi.string().optional(),
  bank_account_iban: Joi.string().allow('').optional(),
  bank_account_name: Joi.string().allow('').optional(),
  type: Joi.string().optional(),
});
