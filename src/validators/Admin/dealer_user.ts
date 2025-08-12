import Joi from 'joi';

export const dealerUserSchema = Joi.object({
  type: Joi.string().required(),
  name_surname: Joi.string().required(),
  tc_no: Joi.string().required(),
  gsm: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  dealer_id: Joi.string().required(),
});

export const dealerUserUpdateSchema = Joi.object({
  name_surname: Joi.string().optional(),
  tc_no: Joi.string().optional(),
  gsm: Joi.string().optional(),
  email: Joi.string().optional(),
  password: Joi.string().optional(),
  dealer_id: Joi.string().optional(),
  status: Joi.boolean().optional(),
  type: Joi.string().optional(),
});

export const dealerUserVerifySchema = Joi.object({
  dealer_user_id: Joi.string().required(),
  otp_code: Joi.string().required(),
});

export const dealerUserResendOtpSchema = Joi.object({
  dealer_user_id: Joi.string().required(),
});
