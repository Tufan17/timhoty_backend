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

export const solutionPartnerUserSchema = Joi.object({
  solution_partner_id: Joi.string().required(),
  type: Joi.string().required().valid("manager", "worker"),
  name_surname: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  language_code: Joi.string().required(),
});

export const solutionPartnerUserUpdateSchema = Joi.object({ 
  type: Joi.string().optional().valid("manager", "worker")  ,
  solution_partner_id: Joi.string().optional(),
  name_surname: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  language_code: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const solutionPartnerCommissionSchema = Joi.object({
  solution_partner_id: Joi.string().required(),
  service_type: Joi.string().required().valid("hotel", "rental", "activity", "tour","visa"),
  commission_type: Joi.string().required().valid("percentage", "fixed"),
  commission_value: Joi.number().required(),
  commission_currency: Joi.string().required().valid("USD", "EUR", "TRY"),
  service_id: Joi.string().optional().allow(null),
});

export const solutionPartnerCommissionUpdateSchema = Joi.object({
  service_type: Joi.string().optional().valid("hotel", "rental", "activity", "tour","visa"),
  commission_type: Joi.string().optional().valid("percentage", "fixed"),
  commission_value: Joi.number().optional(),
  commission_currency: Joi.string().optional().valid("USD", "EUR", "TRY"),
  service_id: Joi.string().optional().allow(null),
});


export const solutionPartnerRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  nameSolutionPartner: Joi.string().required(),
  phoneSolutionPartner: Joi.string().required(),
  addressSolutionPartner: Joi.string().required(),
  taxOffice: Joi.string().required(),
  taxNumber: Joi.string().required(),
  bankName: Joi.string().required(),
  swiftNumber: Joi.string().required(),
  accountOwner: Joi.string().required(),
  iban: Joi.string().required(),
  nameSurname: Joi.string().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required(),
  password: Joi.string().required(),
});
