import Joi from 'joi';

export const solutionPartnerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  address: Joi.string().optional(),
  tax_office: Joi.string().optional(),
  tax_number: Joi.string().optional(),
  bank_name: Joi.string().optional(),
  swift_number: Joi.string().optional(),
  account_owner: Joi.string().optional(),
  iban: Joi.string().optional(),
  language_code: Joi.string().required(),
  location_id: Joi.string().required(),
});

export const solutionPartnerUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  tax_office: Joi.string().optional(),
  tax_number: Joi.string().optional(),
  bank_name: Joi.string().optional(),
  swift_number: Joi.string().optional(),
  account_owner: Joi.string().optional(),
  iban: Joi.string().optional(),
  language_code: Joi.string().optional(),
  status: Joi.boolean().optional(),
  admin_verified: Joi.boolean().optional(),
  application_status_id: Joi.string().optional(),
  location_id: Joi.string().optional(),
});

export const solutionPartnerDocSchema = Joi.object({
  solution_partner_id: Joi.string().required(),
  doc_url: Joi.string().required(),
});

export const solutionPartnerDocUpdateSchema = Joi.object({
  doc_url: Joi.string().optional(),
});

