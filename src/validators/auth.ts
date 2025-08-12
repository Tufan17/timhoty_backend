import Joi from 'joi';

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});


export const dealerLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const userLoginSchema = Joi.object({
  tc_number: Joi.string().required(),
  phone_number: Joi.string().required(),
  type: Joi.string().required(),
});

export const userVerifyOtpSchema = Joi.object({
  type: Joi.string().required(),
  code: Joi.string().required(),
});

export const userRegisterSchema = Joi.object({
  name_surname: Joi.string().required(),
  job_id: Joi.string().required(),
  email: Joi.string().email().required(),
});