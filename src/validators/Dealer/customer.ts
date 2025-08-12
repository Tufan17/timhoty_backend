import Joi from 'joi';

export const customerSchema = Joi.object({
  tc_no: Joi.string().length(11).pattern(/^[0-9]+$/).required()
    .messages({
      'string.length': 'TC kimlik numarası 11 haneli olmalıdır',
      'string.pattern.base': 'TC kimlik numarası sadece rakamlardan oluşmalıdır'
    }),
  phone: Joi.string().length(11).pattern(/^[0-9]+$/).required()
    .messages({
      'string.length': 'Telefon numarası 11 haneli olmalıdır',
      'string.pattern.base': 'Telefon numarası sadece rakamlardan oluşmalıdır'
    }),
  name_surname: Joi.string().required(),
  email: Joi.string().email().required(),
  job_id: Joi.string().optional(),
  dealer_id: Joi.string().optional(),
});

export const customerVerificationSchema = Joi.object({
  id: Joi.string().required(),
  otp_code: Joi.string().required(),
});

export const customerResendOtpSchema = Joi.object({
  id: Joi.string().required(),
});

export const customerUpdateSchema = Joi.object({
  name_surname: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  device_id: Joi.string().optional(),
  job_id: Joi.string().optional(),
  dealer_id: Joi.string().optional(),
});

