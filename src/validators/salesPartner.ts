import Joi from 'joi';

export const salesPartnerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  whatsapp_no: Joi.string().optional(),
  telegram_no: Joi.string().optional(),
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

export const salesPartnerUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  whatsapp_no: Joi.string().optional(),
  telegram_no: Joi.string().optional(),
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

export const salesPartnerDocSchema = Joi.object({
  sales_partner_id: Joi.string().required(),
  doc_url: Joi.string().required(),
});

export const salesPartnerDocUpdateSchema = Joi.object({
  doc_url: Joi.string().optional(),
});

export const salesPartnerUserSchema = Joi.object({
  sales_partner_id: Joi.string().required(),
  type: Joi.string().required().valid("manager", "worker"),
  name_surname: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  language_code: Joi.string().required(),
});

export const salesPartnerUserUpdateSchema = Joi.object({ 
  type: Joi.string().optional().valid("manager", "worker"),
  sales_partner_id: Joi.string().optional(),
  name_surname: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  language_code: Joi.string().optional(),
  status: Joi.boolean().optional(),
});

export const salesPartnerCommissionSchema = Joi.object({
  sales_partner_id: Joi.string().required(),
  service_type: Joi.string().required().valid("hotel", "car_rental", "activity", "tour"),
  commission_type: Joi.string().required().valid("percentage", "fixed"),
  commission_value: Joi.number().required(),
  commission_currency: Joi.string().required().valid("USD", "EUR", "TRY"),
  service_id: Joi.string().optional(),
});

export const salesPartnerCommissionUpdateSchema = Joi.object({
  service_type: Joi.string().optional().valid("hotel", "car_rental", "activity", "tour"),
  commission_type: Joi.string().optional().valid("percentage", "fixed"),
  commission_value: Joi.number().optional(),
  commission_currency: Joi.string().optional().valid("USD", "EUR", "TRY"),
  service_id: Joi.string().optional(),
});

export const salesPartnerLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const salesPartnerRegisterSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  nameSalesPartner: Joi.string().required(),
  phoneSalesPartner: Joi.string().required(),
  addressSalesPartner: Joi.string().required(),
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

export const salesPartnerIndexUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  whatsapp_no: Joi.string().optional(),
  telegram_no: Joi.string().optional(),
  address: Joi.string().optional(),
  tax_office: Joi.string().optional(),
  tax_number: Joi.string().optional(),
  bank_name: Joi.string().optional(),
  swift_number: Joi.string().optional(),
  account_owner: Joi.string().optional(),
  iban: Joi.string().optional(),
});