import Joi from 'joi';

export const userSchema = Joi.object({
  tc_no: Joi.string().required(),
  phone: Joi.string().required(),
  name_surname: Joi.string().required(),
  email: Joi.string().required(),
  job_id: Joi.string().optional(),
  dealer_id: Joi.string().optional(),
});

export const userVerificationSchema = Joi.object({
  id: Joi.string().required(),
  otp_code: Joi.string().required(),
});

export const userResendOtpSchema = Joi.object({
  id: Joi.string().required(),
});

export const userUpdateSchema = Joi.object({
  name_surname: Joi.string().optional(),
  email: Joi.string().optional(),
  password: Joi.string().optional(),
  device_id: Joi.string().optional(),
  job_id: Joi.string().optional(),
  dealer_id: Joi.string().optional(),
});

