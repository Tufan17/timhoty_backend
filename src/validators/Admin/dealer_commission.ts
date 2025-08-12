import Joi from 'joi';

export const dealerCommissionSchema = Joi.object({
  dealer_id: Joi.string().required(),
  insurance_type_id: Joi.string().required(),
  commission_rate: Joi.number().required(),
});

export const dealerCommissionUpdateSchema = Joi.object({
  dealer_id: Joi.string().optional(),
  insurance_type_id: Joi.string().optional(),
  commission_rate: Joi.number().optional(),
});
